import { createClient } from 'redis';
import { Redis as UpstashRedis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config();

// --- Required environment variables -----------------------------------
// No hardcoded fallback secrets: fail fast and loudly instead of silently
// running against a committed credential.
const restUrl = process.env.UPSTASH_REDIS_REST_URL;
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const tcpUrl = process.env.REDIS_URL;

if (!restUrl || !restToken) {
  throw new Error(
    '[Redis] Missing required env vars UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. ' +
    'Refusing to start with no credentials configured.'
  );
}

export const upstashRest = new UpstashRedis({
  url: restUrl,
  token: restToken,
});

let activeClient: any = null;
let isRedisReady = false;
let hasPurgedStaleCache = false; // guard: only purge once per process, not on every reconnect

// Minimal pipeline abstraction used by the REST fallback so multiple
// command types (not just `set`) are supported, and `this` binds correctly.
type PipelineCommand = () => Promise<any>;

class RestPipeline {
  private commands: PipelineCommand[] = [];

  set(key: string, value: string) {
    this.commands.push(() => upstashRest.set(key, value));
    return this;
  }

  get(key: string) {
    this.commands.push(() => upstashRest.get(key));
    return this;
  }

  del(key: string) {
    this.commands.push(() => upstashRest.del(key));
    return this;
  }

  incr(key: string) {
    this.commands.push(() => upstashRest.incr(key));
    return this;
  }

  expire(key: string, seconds: number) {
    this.commands.push(() => upstashRest.expire(key, seconds));
    return this;
  }

  async exec() {
    // Run sequentially and report per-command success/failure rather than
    // masking everything behind a single null/rejection.
    const results: Array<{ ok: boolean; value?: any; error?: string }> = [];
    for (const cmd of this.commands) {
      try {
        const value = await cmd();
        results.push({ ok: true, value });
      } catch (err: any) {
        console.error('[Redis Pipeline REST Error] command failed:', err?.message ?? err);
        results.push({ ok: false, error: err?.message ?? String(err) });
      }
    }
    return results;
  }
}

// Transparent proxy to delegate calls to the active TCP client or Upstash REST
export const redis: any = new Proxy(
  {},
  {
    get(target, prop, receiver) {
      if (prop === 'pipeline') {
        return () => {
          if (activeClient && isRedisReady) {
            const multi = activeClient.multi();
            const originalExec = multi.exec.bind(multi);
            multi.exec = async () => {
              try {
                return await originalExec();
              } catch (err: any) {
                console.error('[Redis Pipeline TCP Error] exec failed:', err?.message ?? err);
                throw err; // surface it — caller decides how to handle, don't silently return null
              }
            };
            return multi;
          }
          return new RestPipeline();
        };
      }

      if (activeClient && isRedisReady) {
        const value = Reflect.get(activeClient, prop, receiver);
        if (typeof value === 'function') {
          return value.bind(activeClient);
        }
        return value;
      }

      // REST fallback for direct calls
      return async (...args: any[]) => {
        const fn = (upstashRest as any)[prop];
        if (typeof fn !== 'function') {
          throw new Error(`[Redis Proxy] '${String(prop)}' is not a valid Redis command`);
        }
        try {
          return await fn.apply(upstashRest, args);
        } catch (err: any) {
          console.error(`[Redis Proxy REST Error] call to '${String(prop)}' failed:`, err?.message ?? err);
          throw err;
        }
      };
    },
    set(target, prop, value, receiver) {
      if (!activeClient) {
        console.warn(`[Redis Proxy] Ignored attempt to set '${String(prop)}' before a TCP client is active`);
        return false;
      }
      return Reflect.set(activeClient, prop, value, receiver);
    },
  }
);

export const connectRedis = async () => {
  if (!tcpUrl) {
    console.warn('[Redis] REDIS_URL not set — running on Upstash REST API only.');
    isRedisReady = false;
    activeClient = null;
    await purgeStaleCacheOnce();
    return true;
  }

  console.log(
    `[Redis] Initializing Upstash Dual Engine (REST: ${restUrl} | TCP: ${tcpUrl.replace(/:[^:@]+@/, ':****@')})`
  );

  try {
    const socketOptions: any = {};
    if (tcpUrl.startsWith('rediss://')) {
      socketOptions.tls = true;
      // Certificate verification stays ON. Disabling it (rejectUnauthorized:
      // false) defeats TLS and exposes the connection to MITM attacks.
    }

    const realClient = createClient({
      url: tcpUrl,
      socket: socketOptions,
    });

    realClient.on('error', (err) => {
      console.error('[Redis Client Error] socket issue:', err?.message ?? err);
      isRedisReady = false;
    });

    realClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting TCP client...');
    });

    realClient.on('ready', () => {
      console.log('[Redis] TCP client ready for commands.');
      isRedisReady = true;
    });

    await realClient.connect();
    await realClient.ping();

    activeClient = realClient;
    isRedisReady = true;
    console.log('[Redis] Connected & PING verified via TCP successfully.');
    await purgeStaleCacheOnce();
    return true;
  } catch (error: any) {
    console.error('[Redis Connection Error] TCP connection failed, falling back to REST:', error?.message ?? error);
    isRedisReady = false;
    activeClient = null;
    await purgeStaleCacheOnce();
    return true;
  }
};

async function purgeStaleCacheOnce(): Promise<void> {
  if (hasPurgedStaleCache) return;
  hasPurgedStaleCache = true;
  await SafeRedis.purgeStaleCache();
}

export class SafeRedis {
  static isConnected(): boolean {
    return Boolean(restUrl && restToken) || (isRedisReady && activeClient !== null);
  }

  static async purgeStaleCache(): Promise<void> {
    try {
      console.log('[SafeRedis] Purging stale legacy cache keys from Upstash Redis...');
      const keys = await upstashRest.keys('fare:*');
      if (Array.isArray(keys) && keys.length > 0) {
        const results = await Promise.allSettled(keys.map((k) => upstashRest.del(k)));
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          console.warn(`[SafeRedis] ${failed}/${keys.length} stale keys failed to delete.`);
        }
      }
      console.log('[SafeRedis] Stale cache purge complete.');
    } catch (err: any) {
      console.error('[SafeRedis] Stale cache purge failed:', err?.message ?? err);
    }
  }

  static async safeGet(key: string): Promise<string | null> {
    try {
      const val = await upstashRest.get(key);
      if (val !== null && val !== undefined) {
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    } catch (err: any) {
      console.error(`[SafeRedis REST Error] read failed for key '${key}':`, err?.message ?? err);
    }

    if (isRedisReady && activeClient) {
      try {
        return await activeClient.get(key);
      } catch (err: any) {
        console.error(`[SafeRedis TCP Error] read failed for key '${key}':`, err?.message ?? err);
      }
    }

    return null;
  }

  static async safeSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    let success = false;

    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await upstashRest.set(key, value, { ex: ttlSeconds });
      } else {
        await upstashRest.set(key, value);
      }
      success = true;
    } catch (err: any) {
      console.error(`[SafeRedis REST Error] write failed for key '${key}':`, err?.message ?? err);
    }

    if (isRedisReady && activeClient) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await activeClient.set(key, value, { EX: ttlSeconds });
        } else {
          await activeClient.set(key, value);
        }
        success = true;
      } catch (err: any) {
        console.error(`[SafeRedis TCP Error] write failed for key '${key}':`, err?.message ?? err);
      }
    }

    return success;
  }

  static async safeDel(key: string): Promise<boolean> {
    let success = false;

    try {
      await upstashRest.del(key);
      success = true;
    } catch (err: any) {
      console.error(`[SafeRedis REST Error] delete failed for key '${key}':`, err?.message ?? err);
    }

    if (isRedisReady && activeClient) {
      try {
        await activeClient.del(key);
        success = true;
      } catch (err: any) {
        console.error(`[SafeRedis TCP Error] delete failed for key '${key}':`, err?.message ?? err);
      }
    }

    return success;
  }
}
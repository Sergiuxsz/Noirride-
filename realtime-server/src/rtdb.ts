import { getDatabase } from 'firebase-admin/database';
import { getApps } from 'firebase-admin/app';

let hasPurgedStaleCache = false;

export class SafeRTDB {
  static isConnected(): boolean {
    return getApps().length > 0;
  }

  static async purgeStaleCache(): Promise<void> {
    if (hasPurgedStaleCache) return;
    hasPurgedStaleCache = true;
    try {
      if (!this.isConnected()) return;
      console.log('[SafeRTDB] Purging stale cache keys from RTDB...');
      const db = getDatabase();
      const ref = db.ref('cache');
      
      // Simple purge: remove the entire cache node to clear all stale prices
      await ref.remove();
      console.log('[SafeRTDB] Stale cache purge complete.');
    } catch (err: any) {
      console.error('[SafeRTDB] Stale cache purge failed:', err?.message ?? err);
    }
  }

  static async safeGet(key: string): Promise<string | null> {
    if (!this.isConnected()) return null;
    
    try {
      // RTDB keys can't contain '.', '#', '$', '[', or ']'
      const safeKey = key.replace(/[.#$\[\]]/g, '_');
      const db = getDatabase();
      const snapshot = await db.ref(`cache/${safeKey}`).once('value');
      
      if (snapshot.exists()) {
        const val = snapshot.val();
        
        // Handle TTL logic
        if (val.expiresAt && val.expiresAt < Date.now()) {
          // Expired
          await db.ref(`cache/${safeKey}`).remove();
          return null;
        }
        
        return typeof val.data === 'object' ? JSON.stringify(val.data) : String(val.data);
      }
    } catch (err: any) {
      console.error(`[SafeRTDB Error] read failed for key '${key}':`, err?.message ?? err);
    }

    return null;
  }

  static async safeSet(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected()) return false;
    let success = false;

    try {
      const safeKey = key.replace(/[.#$\[\]]/g, '_');
      const db = getDatabase();
      
      let parsedValue = value;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // Leave as string if it's not JSON
      }

      const payload: any = {
        data: parsedValue,
        updatedAt: Date.now()
      };

      if (ttlSeconds && ttlSeconds > 0) {
        payload.expiresAt = Date.now() + (ttlSeconds * 1000);
      }

      await db.ref(`cache/${safeKey}`).set(payload);
      success = true;
    } catch (err: any) {
      console.error(`[SafeRTDB Error] write failed for key '${key}':`, err?.message ?? err);
    }

    return success;
  }

  static async safeDel(key: string): Promise<boolean> {
    if (!this.isConnected()) return false;
    let success = false;

    try {
      const safeKey = key.replace(/[.#$\[\]]/g, '_');
      const db = getDatabase();
      await db.ref(`cache/${safeKey}`).remove();
      success = true;
    } catch (err: any) {
      console.error(`[SafeRTDB Error] delete failed for key '${key}':`, err?.message ?? err);
    }

    return success;
  }
}

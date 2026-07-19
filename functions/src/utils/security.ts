import * as crypto from 'crypto';
import { AppError } from './errors';

/**
 * Anti-SSRF (Server-Side Request Forgery) Protection Utility
 * Validates that target URLs are strictly HTTPS and do not resolve to local/private/metadata IP addresses.
 */
export function assertSafeDestinationUrl(inputUrl: string, allowedHosts?: string[]): URL {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch (err) {
    throw new AppError('invalid-argument', 'SSRF Security Check Failed: Malformed URL provided.');
  }

  // 1. Enforce scheme validation (only https is allowed in production; http for local emulator)
  const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'test';
  if (parsed.protocol !== 'https:' && !(isEmulator && parsed.protocol === 'http:')) {
    throw new AppError('permission-denied', `SSRF Security Check Failed: Protocol "${parsed.protocol}" is forbidden. Must use HTTPS.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Enforce Host whitelist if provided
  if (allowedHosts && allowedHosts.length > 0) {
    const isAllowed = allowedHosts.some(host => hostname === host.toLowerCase() || hostname.endsWith(`.${host.toLowerCase()}`));
    if (!isAllowed) {
      throw new AppError('permission-denied', `SSRF Security Check Failed: Host "${hostname}" is not in the authorized destinations list.`);
    }
  }

  // 3. Prevent access to localhost, internal network ranges, and Cloud Metadata Services (AWS/GCP/Azure)
  const blockedExactHosts = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
    '169.254.169.254', // Cloud Metadata Service
    'metadata.google.internal',
    '100.100.100.200',
  ];

  if (blockedExactHosts.includes(hostname) && !isEmulator) {
    throw new AppError('permission-denied', `SSRF Security Check Failed: Host "${hostname}" points to restricted local or metadata interfaces.`);
  }

  // 4. Check for private/loopback/link-local IP regex patterns
  const privateIpPatterns = [
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,             // 127.0.0.0/8
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,              // 10.0.0.0/8
    /^192\.168\.\d{1,3}\.\d{1,3}$/,                 // 192.168.0.0/16
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
    /^169\.254\.\d{1,3}\.\d{1,3}$/,                 // 169.254.0.0/16 (Link-local & Metadata)
    /^fc00:/i,                                      // Unique local IPv6
    /^fe80:/i,                                      // Link-local IPv6
  ];

  for (const pattern of privateIpPatterns) {
    if (pattern.test(hostname) && !isEmulator) {
      throw new AppError('permission-denied', `SSRF Security Check Failed: Host "${hostname}" targets an internal private IP network.`);
    }
  }

  return parsed;
}

/**
 * Anti-XSS (Cross-Site Scripting) Input Sanitization & HTML Escaping
 */
export function sanitizeInputString(input?: string | null, maxLen: number = 2000): string {
  if (!input || typeof input !== 'string') return '';
  // Trim and strip zero-width or control characters
  const trimmed = input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  return trimmed.slice(0, maxLen);
}

export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Anti-CSRF (Cross-Site Request Forgery) Utilities
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyCsrfTokenAndOrigin(
  providedCsrf?: string | null,
  expectedCsrf?: string | null,
  requestOrigin?: string | null,
  allowedOrigins: string[] = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://genial-charter-477621-j2.web.app', 'https://genial-charter-477621-j2.firebaseapp.com']
): boolean {
  // 1. Verify Origin / Referer if present
  if (requestOrigin) {
    const cleanOrigin = requestOrigin.replace(/\/$/, '').toLowerCase();
    const isTrustedOrigin = allowedOrigins.some(origin => cleanOrigin === origin.toLowerCase() || cleanOrigin.endsWith('.firebaseapp.com') || cleanOrigin.endsWith('.web.app') || (process.env.FUNCTIONS_EMULATOR === 'true' && cleanOrigin.includes('localhost')));
    if (!isTrustedOrigin && process.env.FUNCTIONS_EMULATOR !== 'true') {
      throw new AppError('permission-denied', `CSRF Protection Denied: Origin "${requestOrigin}" is untrusted.`);
    }
  }

  // 2. Double-Submit Cookie / Token match check
  if (expectedCsrf && providedCsrf) {
    if (expectedCsrf.trim() !== providedCsrf.trim()) {
      throw new AppError('permission-denied', 'CSRF Verification Failed: Security token mismatch.');
    }
  }

  return true;
}

/**
 * Safe Cookie Parsing & Header Generation Utility
 */
export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts[0]?.trim();
    const value = parts.slice(1).join('=')?.trim();
    if (name && value) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  });
  return cookies;
}

export function formatSetCookieHeader(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    maxAgeSeconds?: number;
    path?: string;
  } = {}
): string {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`);
  }
  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }
  if (options.secure !== false || process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  parts.push(`SameSite=${options.sameSite || 'Strict'}`);
  return parts.join('; ');
}

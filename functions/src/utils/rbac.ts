import { auth, db } from './firebase-admin';
import { AppError } from './errors';
import type { UserRole, Permission, UserProfile } from '../models/user.types';
import type { CallableRequest } from 'firebase-functions/v2/https';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  client: [
    'bookings:create',
    'bookings:read',
    'bookings:cancel',
  ],
  driver: [
    'bookings:read',
    'bookings:update_status',
  ],
  dispatcher: [
    'bookings:create',
    'bookings:read',
    'bookings:cancel',
    'bookings:update_status',
    'users:read',
    'fleet:manage',
  ],
  admin: [
    'bookings:create',
    'bookings:read',
    'bookings:cancel',
    'bookings:update_status',
    'users:read',
    'users:manage',
    'fleet:manage',
    'system:admin',
  ],
};

export function hasPermission(role: UserRole, requiredPerm: Permission, customPerms?: Permission[]): boolean {
  if (role === 'admin') return true;
  if (customPerms && customPerms.includes(requiredPerm)) return true;
  const rolePerms = ROLE_PERMISSIONS[role] || [];
  return rolePerms.includes(requiredPerm);
}

export function getAllPermissionsForRole(role: UserRole, customPerms?: Permission[]): Permission[] {
  const base = ROLE_PERMISSIONS[role] || [];
  if (!customPerms || customPerms.length === 0) return base;
  return Array.from(new Set([...base, ...customPerms]));
}

/**
 * Core RBAC & Session Verifier
 * - Admin users: Verified via STATELESS JWT token (`verifyIdToken(token, false)`). No DB lookup required.
 * - Regular users: Verified via STATEFUL Firebase Session Cookie (`verifySessionCookie(cookie, true)`) + live Firestore profile check.
 */
export async function verifyAuthTokenAndRBAC(
  tokenOrCookie: string,
  requiredPermission?: Permission,
  isSessionCookieHeader?: boolean
): Promise<{
  uid: string;
  role: UserRole;
  permissions: Permission[];
  isStatelessAdmin: boolean;
  profile?: UserProfile;
}> {
  if (!tokenOrCookie || typeof tokenOrCookie !== 'string') {
    throw new AppError('unauthenticated', 'Security Clearance Denied: No authentication token or session cookie provided.');
  }

  let decodedClaims: any;
  let isVerifiedCookie = false;

  // 1. Try checking if it is a stateful Firebase Session Cookie first if requested or likely cookie
  if (isSessionCookieHeader || tokenOrCookie.length > 500) {
    try {
      decodedClaims = await auth.verifySessionCookie(tokenOrCookie, true); // checkRevoked = true (STATEFUL)
      isVerifiedCookie = true;
    } catch (cookieErr) {
      // Fallback: try verifying as ID/JWT token
      try {
        decodedClaims = await auth.verifyIdToken(tokenOrCookie, false); // checkRevoked = false for stateless check
      } catch (idErr) {
        throw new AppError('unauthenticated', 'Security Clearance Denied: Session cookie or JWT token is invalid or expired.');
      }
    }
  } else {
    try {
      decodedClaims = await auth.verifyIdToken(tokenOrCookie, false); // checkRevoked = false
    } catch (idErr) {
      throw new AppError('unauthenticated', 'Security Clearance Denied: JWT token verification failed.');
    }
  }

  const uid = decodedClaims.uid;
  const claimRole: UserRole = decodedClaims.role || 'client';

  // 2. STATELESS ADMIN CHECK: If token claims state role === 'admin' and it is a JWT token (or verified claims),
  // we grant stateless authentication without querying Firestore (`db.collection('users')`).
  if (claimRole === 'admin' && !isVerifiedCookie) {
    const adminPerms = ROLE_PERMISSIONS['admin'];
    if (requiredPermission && !hasPermission('admin', requiredPermission)) {
      throw new AppError('permission-denied', `Protocol Violation: Admin role lacks "${requiredPermission}".`);
    }
    return {
      uid,
      role: 'admin',
      permissions: adminPerms,
      isStatelessAdmin: true,
    };
  }

  // 3. STATEFUL REGULAR USER CHECK: For regular users ('client', 'driver', 'dispatcher') or cookie-based sessions,
  // we statefully query Firestore to check active account status, exact live role, and custom permissions.
  let profile: UserProfile;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      // If user profile doesn't exist yet but auth is valid, default to client
      const now = new Date().toISOString();
      profile = {
        uid,
        email: decodedClaims.email || `${uid}@noirride.vip`,
        fullName: decodedClaims.name || 'VIP Client',
        vipTier: decodedClaims.vipTier || 'Gold',
        role: claimRole || 'client',
        preferredCurrency: 'EUR',
        preferredLanguage: 'EN',
        isArmoredCleared: false,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      profile = userDoc.data() as UserProfile;
    }
  } catch (err) {
    // If emulator fallback / offline or DB error, fallback gracefully
    profile = {
      uid,
      email: decodedClaims.email || `${uid}@noirride.vip`,
      fullName: decodedClaims.name || 'Executive Client',
      vipTier: 'Gold',
      role: claimRole || 'client',
      preferredCurrency: 'EUR',
      preferredLanguage: 'EN',
      isArmoredCleared: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (profile.isActive === false) {
    throw new AppError('permission-denied', 'Executive Protocol Access Suspended: User profile is deactivated or revoked.');
  }

  let activeRole = profile.role || claimRole || 'client';
  let activePerms = getAllPermissionsForRole(activeRole, profile.permissions);

  // If user is inside admin_roles collection across any ID format or email, ensure they have full admin privileges
  if (activeRole !== 'admin') {
    try {
      const adminDocById = await db.collection('admin_roles').doc(uid).get();
      const adminDocByUid = await db.collection('admin_roles').where('uid', '==', uid).limit(1).get();
      const userEmail = profile.email || decodedClaims.email;
      const adminDocByEmail = userEmail ? await db.collection('admin_roles').where('email', '==', userEmail).limit(1).get() : null;
      const adminDocByDocEmail = userEmail ? await db.collection('admin_roles').doc(userEmail).get() : null;

      // Check if document exists AND does not explicitly set isAdmin to false
      const docData = adminDocById.exists ? adminDocById.data() : (!adminDocByUid.empty ? adminDocByUid.docs[0].data() : ((adminDocByEmail && !adminDocByEmail.empty) ? adminDocByEmail.docs[0].data() : (adminDocByDocEmail?.exists ? adminDocByDocEmail.data() : null)));
      const isConfiguredAdmin = docData && (docData.isAdmin === true || docData.role === 'admin' || docData.isAdmin !== false);

      if (adminDocById.exists || !adminDocByUid.empty || (adminDocByEmail && !adminDocByEmail.empty) || (adminDocByDocEmail && adminDocByDocEmail.exists)) {
        if (isConfiguredAdmin) {
          activeRole = 'admin';
          activePerms = getAllPermissionsForRole('admin');
          await db.collection('users').doc(uid).update({ role: 'admin', updatedAt: new Date().toISOString() }).catch(() => {});
        }
      }
    } catch {}
  }

  if (requiredPermission && !hasPermission(activeRole, requiredPermission, activePerms)) {
    throw new AppError(
      'permission-denied',
      `Protocol Clearance Denied: Role "${activeRole}" does not have authorization for "${requiredPermission}".`
    );
  }

  return {
    uid,
    role: activeRole,
    permissions: activePerms,
    isStatelessAdmin: activeRole === 'admin' && !isVerifiedCookie,
    profile,
  };
}

/**
 * Helper for Firebase Callable requests (onCall)
 */
export async function verifyCallableAuth(
  request: CallableRequest,
  requiredPermission?: Permission
): Promise<{
  uid: string;
  role: UserRole;
  permissions: Permission[];
  isStatelessAdmin: boolean;
  profile?: UserProfile;
}> {
  // If token string is passed in request.data.token or request.data.sessionCookie, verify that directly
  const customToken = request.data?.token || request.data?.sessionCookie;
  if (customToken && typeof customToken === 'string') {
    return verifyAuthTokenAndRBAC(customToken, requiredPermission, !!request.data?.sessionCookie);
  }

  // Otherwise check request.auth context provided by Firebase SDK
  if (!request.auth || !request.auth.uid) {
    // Emulator fallback check if running purely local without Auth emulator credentials attached
    if (process.env.FUNCTIONS_EMULATOR === 'true' && request.data?.uid) {
      const mockUid = request.data.uid;
      const mockRole = request.data.role || 'client';
      return {
        uid: mockUid,
        role: mockRole as UserRole,
        permissions: getAllPermissionsForRole(mockRole as UserRole),
        isStatelessAdmin: mockRole === 'admin',
      };
    }
    throw new AppError('unauthenticated', 'Security Clearance Denied: You must be signed in to invoke this executive command.');
  }

  const uid = request.auth.uid;
  const tokenString = request.auth.token ? (request.rawRequest?.headers?.authorization?.split('Bearer ')[1] || request.data?.token) : null;

  if (tokenString) {
    return verifyAuthTokenAndRBAC(tokenString, requiredPermission);
  }

  // Check from request.auth.token claims directly if raw header isn't available
  const claimRole: UserRole = (request.auth.token?.role as UserRole) || 'client';
  if (claimRole === 'admin') {
    if (requiredPermission && !hasPermission('admin', requiredPermission)) {
      throw new AppError('permission-denied', `Protocol Violation: Admin role lacks "${requiredPermission}".`);
    }
    return {
      uid,
      role: 'admin',
      permissions: ROLE_PERMISSIONS['admin'],
      isStatelessAdmin: true,
    };
  }

  // Query stateful profile
  const userDoc = await db.collection('users').doc(uid).get();
  const profile = (userDoc.exists ? userDoc.data() : { uid, role: claimRole, isActive: true }) as UserProfile;

  if (profile.isActive === false) {
    throw new AppError('permission-denied', 'Executive Protocol Access Suspended: User profile is deactivated.');
  }

  let activeRole = profile.role || claimRole || 'client';
  let activePerms = getAllPermissionsForRole(activeRole, profile.permissions);

  // If user is inside admin_roles collection across any ID format or email, ensure they have full admin privileges
  if (activeRole !== 'admin') {
    try {
      const adminDocById = await db.collection('admin_roles').doc(uid).get();
      const adminDocByUid = await db.collection('admin_roles').where('uid', '==', uid).limit(1).get();
      const userEmail = profile.email || request.auth.token?.email;
      const adminDocByEmail = userEmail ? await db.collection('admin_roles').where('email', '==', userEmail).limit(1).get() : null;
      const adminDocByDocEmail = userEmail ? await db.collection('admin_roles').doc(userEmail).get() : null;

      // Deserialize document data and check isAdmin boolean explicitly
      const docData = adminDocById.exists ? adminDocById.data() : (!adminDocByUid.empty ? adminDocByUid.docs[0].data() : ((adminDocByEmail && !adminDocByEmail.empty) ? adminDocByEmail.docs[0].data() : (adminDocByDocEmail?.exists ? adminDocByDocEmail.data() : null)));
      const isConfiguredAdmin = docData && (docData.isAdmin === true || docData.role === 'admin' || docData.isAdmin !== false);

      if (adminDocById.exists || !adminDocByUid.empty || (adminDocByEmail && !adminDocByEmail.empty) || (adminDocByDocEmail && adminDocByDocEmail.exists)) {
        if (isConfiguredAdmin) {
          activeRole = 'admin';
          activePerms = getAllPermissionsForRole('admin');
          await db.collection('users').doc(uid).update({ role: 'admin', updatedAt: new Date().toISOString() }).catch(() => {});
        }
      }
    } catch {}
  }

  if (requiredPermission && !hasPermission(activeRole, requiredPermission, activePerms)) {
    throw new AppError('permission-denied', `Protocol Clearance Denied: Role "${activeRole}" does not have authorization for "${requiredPermission}".`);
  }

  return {
    uid,
    role: activeRole,
    permissions: activePerms,
    isStatelessAdmin: false,
    profile,
  };
}

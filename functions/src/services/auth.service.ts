import * as logger from 'firebase-functions/logger';
import { auth, db } from '../utils/firebase-admin';
import { AppError } from '../utils/errors';
import type { UserProfile, UserRole, Permission } from '../models/user.types';
import { ROLE_PERMISSIONS, getAllPermissionsForRole } from '../utils/rbac';
import { generateCsrfToken, escapeHtml } from '../utils/security';

const USERS_COLLECTION = 'users';
const SESSION_MAX_AGE_SEC = 5 * 24 * 60 * 60; // 5 days in seconds
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SEC * 1000;

export interface RegisterUserParams {
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

export interface AuthSessionCookieParams {
  idToken: string;
  csrfToken?: string;
}

export interface AssignRoleParams {
  targetUid: string;
  role: UserRole;
  permissions?: Permission[];
}

export class AuthService {
  /**
   * Exchanges a verified Firebase ID Token for a stateful Firebase Session Cookie.
   * Ensures the user exists in Firestore and returns their complete RBAC profile and session data.
   */
  async createSessionCookieFromIdToken(params: AuthSessionCookieParams): Promise<{
    sessionCookie: string;
    csrfToken: string;
    uid: string;
    role: UserRole;
    vipTier: string;
    permissions: Permission[];
    expiresInSeconds: number;
  }> {
    const { idToken, csrfToken } = params;
    logger.info('[AuthService.createSessionCookieFromIdToken] Starting session cookie exchange', {
      idTokenPrefix: idToken ? `${idToken.substring(0, 10)}...` : 'missing',
    });

    if (!idToken) {
      logger.error('[AuthService.createSessionCookieFromIdToken] Missing ID token payload');
      throw new AppError('invalid-argument', 'Valid Firebase ID token is required to initialize session.');
    }

    // 1. Verify ID token strictly with Firebase Admin SDK (checkRevoked = true)
    let decodedToken: any;
    try {
      logger.debug('[AuthService.createSessionCookieFromIdToken] Cryptographically verifying ID token with Firebase Admin SDK');
      decodedToken = await auth.verifyIdToken(idToken, true);
    } catch (err: any) {
      logger.error('[AuthService.createSessionCookieFromIdToken] ID Token verification failed', {
        error: err.message || err,
        code: err.code,
      });
      throw new AppError('unauthenticated', 'Security Clearance Denied: ID Token verification failed. Credentials invalid or expired.');
    }

    const uid = decodedToken.uid;
    logger.info('[AuthService.createSessionCookieFromIdToken] ID token verified successfully', { uid, email: decodedToken.email });

    // 2. Check or initialize user profile in Firestore
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    let profile: UserProfile;
    const activeCsrfToken = csrfToken || generateCsrfToken();

    try {
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        logger.info('[AuthService.createSessionCookieFromIdToken] Profile not found in Firestore, initializing new profile', { uid });
        const now = new Date().toISOString();
        profile = {
          uid,
          email: decodedToken.email || `${uid}@noirride.vip`,
          fullName: decodedToken.name || 'VIP Client',
          vipTier: 'Gold',
          role: (decodedToken.role as UserRole) || 'client',
          permissions: ROLE_PERMISSIONS[(decodedToken.role as UserRole) || 'client'],
          csrfToken: activeCsrfToken,
          preferredCurrency: 'EUR',
          preferredLanguage: 'EN',
          isArmoredCleared: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        await userDocRef.set(profile);
      } else {
        profile = userDoc.data() as UserProfile;
        if (profile.isActive === false) {
          logger.warn('[AuthService.createSessionCookieFromIdToken] Access attempted for suspended account', { uid });
          throw new AppError('permission-denied', 'Account has been deactivated or suspended.');
        }
        await userDocRef.update({
          csrfToken: activeCsrfToken,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (dbErr: any) {
      if (dbErr instanceof AppError) throw dbErr;
      logger.error('[AuthService.createSessionCookieFromIdToken] Firestore error during profile check/update', {
        uid,
        error: dbErr.message || dbErr,
      });
      throw new AppError('internal', 'Database error while verifying executive profile.');
    }

    // 3. Issue stateful Firebase Session Cookie via Admin SDK
    let sessionCookie = '';
    try {
      logger.debug('[AuthService.createSessionCookieFromIdToken] Generating stateful session cookie with Firebase Admin SDK', { uid });
      sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
    } catch (cookieErr: any) {
      logger.error('[AuthService.createSessionCookieFromIdToken] Failed to generate stateful session cookie', {
        uid,
        error: cookieErr.message || cookieErr,
        code: cookieErr.code,
      });
      throw new AppError('internal', 'Failed to issue stateful session cookie. Please verify authentication protocol.');
    }

    let role = profile.role || 'client';
    if (role !== 'admin') {
      try {
        const adminDocById = await db.collection('admin_roles').doc(uid).get();
        const adminDocByUid = await db.collection('admin_roles').where('uid', '==', uid).limit(1).get();
        const userEmail = profile.email || decodedToken.email;
        const adminDocByEmail = userEmail ? await db.collection('admin_roles').where('email', '==', userEmail).limit(1).get() : null;
        const adminDocByDocEmail = userEmail ? await db.collection('admin_roles').doc(userEmail).get() : null;
        if (adminDocById.exists || !adminDocByUid.empty || (adminDocByEmail && !adminDocByEmail.empty) || (adminDocByDocEmail && adminDocByDocEmail.exists)) {
          role = 'admin';
          if (profile.role !== 'admin') {
            await userDocRef.update({ role: 'admin', updatedAt: new Date().toISOString() }).catch(() => {});
            profile.role = 'admin';
          }
        }
      } catch (e) {
        logger.warn('[AuthService.createSessionCookieFromIdToken] Could not check admin_roles collection', { error: e });
      }
    }

    const permissions = getAllPermissionsForRole(role, profile.permissions);

    logger.info('[AuthService.createSessionCookieFromIdToken] Session cookie issued successfully', {
      uid,
      role,
      vipTier: profile.vipTier || 'Gold',
    });

    return {
      sessionCookie,
      csrfToken: activeCsrfToken,
      uid,
      role,
      vipTier: profile.vipTier || 'Gold',
      permissions,
      expiresInSeconds: SESSION_MAX_AGE_SEC,
    };
  }

  /**
   * Registers a new VIP Executive User inside Firebase Auth and initializes custom Firestore profile.
   */
  async registerVIPUser(params: RegisterUserParams): Promise<{
    success: boolean;
    uid: string;
    role: UserRole;
    permissions: Permission[];
    csrfToken: string;
    message: string;
  }> {
    const { email, password, fullName, phone, preferredCurrency = 'EUR', preferredLanguage = 'EN' } = params;
    logger.info('[AuthService.registerVIPUser] Starting VIP user registration', {
      email,
      fullName,
      hasPhone: Boolean(phone),
    });

    const cleanedPhone = phone ? phone.replace(/[^\d+]/g, '') : '';
    const validE164Phone = cleanedPhone.startsWith('+') && cleanedPhone.length >= 10 ? cleanedPhone : undefined;

    let userRecord;
    try {
      logger.debug('[AuthService.registerVIPUser] Calling auth.createUser via Firebase Admin SDK');
      userRecord = await auth.createUser({
        email,
        password,
        displayName: fullName,
        phoneNumber: validE164Phone,
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        logger.info('[AuthService.registerVIPUser] Email already registered, retrieving existing user record', { email });
        try {
          userRecord = await auth.getUserByEmail(email);
        } catch (fetchErr: any) {
          logger.error('[AuthService.registerVIPUser] Failed to retrieve existing user by email', { email, error: fetchErr.message });
          throw new AppError('internal', 'Could not retrieve existing executive account.');
        }
      } else if (authErr.code === 'auth/invalid-phone-number') {
        logger.warn('[AuthService.registerVIPUser] E.164 phone validation failed in Auth SDK, creating without phone', { email });
        try {
          userRecord = await auth.createUser({
            email,
            password,
            displayName: fullName,
          });
        } catch (fallbackErr: any) {
          logger.error('[AuthService.registerVIPUser] Fallback user creation failed', { email, error: fallbackErr.message });
          throw new AppError('invalid-argument', fallbackErr.message || 'Executive profile creation failed.');
        }
      } else {
        logger.error('[AuthService.registerVIPUser] auth.createUser failed', {
          email,
          error: authErr.message || authErr,
          code: authErr.code,
        });
        throw new AppError('invalid-argument', authErr.message || 'Failed to create user account.');
      }
    }

    const now = new Date().toISOString();
    const csrfToken = generateCsrfToken();
    const initialRole: UserRole = 'client';
    const initialPerms = ROLE_PERMISSIONS[initialRole];

    const userProfile: UserProfile = {
      uid: userRecord.uid,
      email,
      phone,
      fullName,
      vipTier: 'Gold',
      role: initialRole,
      permissions: initialPerms,
      csrfToken,
      preferredCurrency,
      preferredLanguage,
      isArmoredCleared: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      logger.debug('[AuthService.registerVIPUser] Saving user profile to Firestore', { uid: userRecord.uid });
      await db.collection(USERS_COLLECTION).doc(userRecord.uid).set(userProfile);

      logger.debug('[AuthService.registerVIPUser] Setting custom user claims on Auth token', { uid: userRecord.uid });
      await auth.setCustomUserClaims(userRecord.uid, {
        vipTier: 'Gold',
        role: initialRole,
        isVIP: true,
      });
    } catch (profileErr: any) {
      logger.error('[AuthService.registerVIPUser] Error saving profile or setting claims', {
        uid: userRecord.uid,
        error: profileErr.message || profileErr,
      });
      throw new AppError('internal', 'Failed to finalize executive profile data.');
    }

    logger.info('[AuthService.registerVIPUser] VIP registration completed successfully', { uid: userRecord.uid, role: initialRole });

    return {
      success: true,
      uid: userRecord.uid,
      role: initialRole,
      permissions: initialPerms,
      csrfToken,
      message: `VIP User ${escapeHtml(fullName)} successfully registered in Executive Protocol.`,
    };
  }

  /**
   * Assigns custom RBAC role and permissions to a target user.
   */
  async assignUserRole(params: AssignRoleParams): Promise<{
    success: boolean;
    targetUid: string;
    assignedRole: UserRole;
    assignedPermissions: Permission[];
    message: string;
  }> {
    const { targetUid, role, permissions } = params;
    logger.info('[AuthService.assignUserRole] Starting role assignment', { targetUid, role });

    const userDocRef = db.collection(USERS_COLLECTION).doc(targetUid);
    let userDoc;
    try {
      userDoc = await userDocRef.get();
    } catch (getErr: any) {
      logger.error('[AuthService.assignUserRole] Error reading target user from Firestore', { targetUid, error: getErr.message });
      throw new AppError('internal', 'Failed to query target user data.');
    }

    if (!userDoc.exists) {
      logger.warn('[AuthService.assignUserRole] Target user UID not found in Firestore', { targetUid });
      throw new AppError('not-found', `Target user UID ${targetUid} not found in Firestore.`);
    }

    const customPerms = (permissions as Permission[]) || ROLE_PERMISSIONS[role];

    try {
      logger.debug('[AuthService.assignUserRole] Updating Firestore document and custom Auth claims', { targetUid, role });
      await userDocRef.update({
        role,
        permissions: customPerms,
        updatedAt: new Date().toISOString(),
      });

      await auth.setCustomUserClaims(targetUid, {
        role,
        isVIP: true,
        vipTier: userDoc.data()?.vipTier || 'Gold',
      });
    } catch (updateErr: any) {
      logger.error('[AuthService.assignUserRole] Failed to update user role/claims', { targetUid, error: updateErr.message });
      throw new AppError('internal', 'Failed to update target user permissions.');
    }

    logger.info('[AuthService.assignUserRole] Role assigned successfully', { targetUid, role });
    return {
      success: true,
      targetUid,
      assignedRole: role,
      assignedPermissions: customPerms,
      message: `Role ${role} assigned to target UID ${targetUid}.`,
    };
  }

  /**
   * Searches users across Firestore for the secret /adminroles route.
   * Checks both users and admin_roles collections to return accurate admin status.
   */
  async searchUsersForAdmin(params: { query?: string }): Promise<Array<{
    uid: string;
    email?: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    isAdminRoleDoc: boolean;
    isDeleted?: boolean;
    createdAt?: string;
  }>> {
    const { query } = params;
    logger.info('[AuthService.searchUsersForAdmin] Searching users', { query: query || 'all' });

    try {
      // Fetch admin_roles collection first to know who is already in admin_roles
      const adminRolesSnap = await db.collection('admin_roles').get();
      const adminRoleUids = new Set<string>();
      const adminRoleEmails = new Set<string>();
      const adminRoleDocsMap = new Map<string, any>();

      adminRolesSnap.docs.forEach((doc) => {
        const d = doc.data() || {};
        if (d.isAdmin !== false) {
          adminRoleUids.add(doc.id);
          if (d.uid) adminRoleUids.add(d.uid);
          if (d.email) adminRoleEmails.add(d.email.toLowerCase());
          adminRoleDocsMap.set(doc.id, d);
        }
      });

      const usersMap = new Map<string, any>();

      // 1. Load users from users collection
      const usersSnap = await db.collection(USERS_COLLECTION).limit(200).get();
      usersSnap.docs.forEach((doc) => {
        const data = doc.data() || {};
        if (data.isDeleted === true) return;
        usersMap.set(doc.id, {
          uid: doc.id,
          email: data.email || '',
          fullName: data.fullName || 'VIP User',
          phone: data.phone || '',
          role: data.role || 'client',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // 2. Load users directly from Firebase Auth
      try {
        const authUsersResult = await auth.listUsers(200);
        authUsersResult.users.forEach((u) => {
          if (!usersMap.has(u.uid)) {
            usersMap.set(u.uid, {
              uid: u.uid,
              email: u.email || '',
              fullName: u.displayName || 'VIP Client',
              phone: u.phoneNumber || '',
              role: (u.customClaims?.role as UserRole) || 'client',
              createdAt: u.metadata.creationTime || new Date().toISOString(),
            });
          }
        });
      } catch (err) {
        logger.warn('[AuthService.searchUsersForAdmin] Could not list auth users:', err);
      }

      // 3. Ensure any user inside admin_roles is included even if missing from users collection or Auth list
      adminRolesSnap.docs.forEach((doc) => {
        const d = doc.data() || {};
        if (d.isAdmin !== false) {
          const docUid = d.uid || doc.id;
          if (!usersMap.has(docUid)) {
            usersMap.set(docUid, {
              uid: docUid,
              email: d.email || '',
              fullName: d.fullName || 'Executive Admin',
              phone: d.phone || '',
              role: 'admin',
              createdAt: d.promotedAt || new Date().toISOString(),
            });
          }
        }
      });

      const results: Array<any> = [];
      const cleanQuery = query ? query.toLowerCase().trim() : '';

      usersMap.forEach((user, uid) => {
        const userEmailLower = (user.email || '').toLowerCase();
        const isAdminRoleDoc = adminRoleUids.has(uid) || (userEmailLower && adminRoleEmails.has(userEmailLower));
        const finalRole: UserRole = (isAdminRoleDoc || user.role === 'admin') ? 'admin' : (user.role as UserRole);

        if (!cleanQuery) {
          results.push({ ...user, role: finalRole, isAdminRoleDoc: isAdminRoleDoc || finalRole === 'admin' });
          return;
        }

        if (
          (user.fullName || '').toLowerCase().includes(cleanQuery) ||
          userEmailLower.includes(cleanQuery) ||
          (user.phone || '').includes(cleanQuery) ||
          uid.toLowerCase().includes(cleanQuery)
        ) {
          results.push({ ...user, role: finalRole, isAdminRoleDoc: isAdminRoleDoc || finalRole === 'admin' });
        }
      });

      logger.info('[AuthService.searchUsersForAdmin] Search completed successfully', { totalMatched: results.length });
      return results;
    } catch (err: any) {
      logger.error('[AuthService.searchUsersForAdmin] Error querying users', { error: err.message });
      throw new AppError('internal', 'Failed to search users from database.');
    }
  }

  /**
   * Promotes a target user to admin role right from /adminroles route.
   * Updates users/{targetUid}, creates/updates admin_roles/{targetUid}, and updates custom claims.
   */
  async promoteUserToAdmin(params: { targetUid: string; callerUid: string }): Promise<{ success: boolean; message: string }> {
    const { targetUid, callerUid } = params;
    logger.info('[AuthService.promoteUserToAdmin] Starting admin promotion', { targetUid, callerUid });

    const userDocRef = db.collection(USERS_COLLECTION).doc(targetUid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      logger.warn('[AuthService.promoteUserToAdmin] Target user not found in users collection', { targetUid });
      throw new AppError('not-found', `User ${targetUid} not found.`);
    }

    const userData = userDoc.data() || {};
    const adminRolePerms = ROLE_PERMISSIONS['admin'];

    try {
      // 1. Update users collection
      await userDocRef.update({
        role: 'admin',
        permissions: adminRolePerms,
        updatedAt: new Date().toISOString(),
      });

      // 2. Set custom claims
      await auth.setCustomUserClaims(targetUid, {
        role: 'admin',
        isVIP: true,
        vipTier: userData.vipTier || 'Gold',
      });

      // 3. Create or update document in admin_roles collection so onSnapshot triggers immediately
      await db.collection('admin_roles').doc(targetUid).set({
        uid: targetUid,
        email: userData.email || `${targetUid}@noirride.vip`,
        fullName: userData.fullName || 'Executive Admin',
        role: 'admin',
        isAdmin: true,
        promotedAt: new Date().toISOString(),
        promotedBy: callerUid,
      }, { merge: true });

      logger.info('[AuthService.promoteUserToAdmin] Successfully promoted user to admin', { targetUid });
      return { success: true, message: `User ${targetUid} promoted to admin successfully.` };
    } catch (err: any) {
      logger.error('[AuthService.promoteUserToAdmin] Failed to promote user to admin', { targetUid, error: err.message });
      throw new AppError('internal', 'Failed to promote user to administrator.');
    }
  }

  /**
   * Revokes admin rights instantly from /adminroles route.
   * Deletes admin_roles/{targetUid}, resets user role to client, and revokes refresh tokens.
   */
  async revokeAdminRole(params: { targetUid: string; callerUid: string }): Promise<{ success: boolean; message: string }> {
    const { targetUid, callerUid } = params;
    logger.info('[AuthService.revokeAdminRole] Starting admin revocation', { targetUid, callerUid });

    const userDocRef = db.collection(USERS_COLLECTION).doc(targetUid);
    const clientPerms = ROLE_PERMISSIONS['client'];

    try {
      // 1. Update users collection to client
      await userDocRef.update({
        role: 'client',
        permissions: clientPerms,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});

      // 2. Set custom claims to client
      await auth.setCustomUserClaims(targetUid, {
        role: 'client',
        isVIP: true,
      }).catch(() => {});

      // 3. Delete from admin_roles collection right away so onSnapshot ejects them <100ms
      await db.collection('admin_roles').doc(targetUid).delete().catch(() => {});

      // 4. Revoke active tokens
      await auth.revokeRefreshTokens(targetUid).catch(() => {});

      logger.info('[AuthService.revokeAdminRole] Successfully revoked admin role', { targetUid });
      return { success: true, message: `Admin privileges revoked for ${targetUid}.` };
    } catch (err: any) {
      logger.error('[AuthService.revokeAdminRole] Failed to revoke admin role', { targetUid, error: err.message });
      throw new AppError('internal', 'Failed to revoke administrator privileges.');
    }
  }

  /**
   * Deletes user account instantly from /adminroles route.
   * Marks users/{targetUid} as isDeleted: true so onSnapshot triggers termination modal right away,
   * then deletes from admin_roles and Firebase Auth.
   */
  async deleteUserAccount(params: { targetUid: string; callerUid: string }): Promise<{ success: boolean; message: string }> {
    const { targetUid, callerUid } = params;
    logger.info('[AuthService.deleteUserAccount] Starting account deletion', { targetUid, callerUid });

    try {
      // 1. Mark user doc as deleted immediately to trigger onSnapshot modal on target client (< 100ms)
      await db.collection(USERS_COLLECTION).doc(targetUid).set({
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: callerUid,
        role: 'client',
      }, { merge: true }).catch(() => {});

      // 2. Delete from admin_roles if present
      await db.collection('admin_roles').doc(targetUid).delete().catch(() => {});

      // 3. Delete user completely from Firebase Auth
      await auth.deleteUser(targetUid).catch((err: any) => {
        logger.warn('[AuthService.deleteUserAccount] Firebase auth.deleteUser warning or already deleted', { error: err.message });
      });

      // 4. Revoke tokens
      await auth.revokeRefreshTokens(targetUid).catch(() => {});

      logger.info('[AuthService.deleteUserAccount] Account deleted successfully', { targetUid });
      return { success: true, message: `Account ${targetUid} deleted successfully.` };
    } catch (err: any) {
      logger.error('[AuthService.deleteUserAccount] Failed to delete account', { targetUid, error: err.message });
      throw new AppError('internal', 'Failed to delete executive account.');
    }
  }
}

export const authService = new AuthService();

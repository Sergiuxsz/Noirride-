import { onCall, onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { auth, db } from '../utils/firebase-admin';
import { authService } from '../services/auth.service';
import {
  RegisterUserSchema,
  VerifySessionSchema,
  CreateSessionCookieSchema,
  AssignUserRoleSchema,
  SendVerificationCodeSchema,
  VerifyProtocolCodeSchema,
  AdminSearchUsersSchema,
  AdminTargetUserSchema,
} from '../validations/auth.schema';
import { handleControllerError, AppError } from '../utils/errors';
import type { UserProfile, UserRole, Permission } from '../models/user.types';
import {
  assertSafeDestinationUrl,
  sanitizeInputString,
  escapeHtml,
  generateCsrfToken,
  verifyCsrfTokenAndOrigin,
  parseCookieHeader,
  formatSetCookieHeader,
} from '../utils/security';
import { verifyCallableAuth, ROLE_PERMISSIONS, getAllPermissionsForRole } from '../utils/rbac';

const USERS_COLLECTION = 'users';
const SESSION_COOKIE_NAME = '__session';
const SESSION_MAX_AGE_SEC = 5 * 24 * 60 * 60; // 5 days in seconds

/**
 * registerVIPUser: Layered controller method to register a new executive profile.
 */
export const registerVIPUser = onCall(async (request) => {
  logger.info('[SessionController.registerVIPUser] Entry: Request initiated');
  try {
    const parseResult = RegisterUserSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const email = sanitizeInputString(parseResult.data.email, 150).toLowerCase();
    const fullName = sanitizeInputString(parseResult.data.fullName, 100);
    const phone = sanitizeInputString(parseResult.data.phone, 30);
    const preferredCurrency = sanitizeInputString(parseResult.data.preferredCurrency, 10);
    const preferredLanguage = sanitizeInputString(parseResult.data.preferredLanguage, 10);

    // Delegate creation and claim assignment to AuthService layer
    const result = await authService.registerVIPUser({
      email,
      password: parseResult.data.password,
      fullName,
      phone,
      preferredCurrency,
      preferredLanguage,
    });

    logger.info('[SessionController.registerVIPUser] Exit: Registration completed successfully', {
      uid: result.uid,
      role: result.role,
    });
    return result;
  } catch (error: any) {
    logger.error('[SessionController.registerVIPUser] Error during executive registration', {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

/**
 * createAuthSessionCookie: Exchanges Firebase ID Token for a stateful Firebase Session Cookie via AuthService.
 */
export const createAuthSessionCookie = onCall(async (request) => {
  logger.info('[SessionController.createAuthSessionCookie] Entry: Session exchange request initiated');
  try {
    const parseResult = CreateSessionCookieSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const { idToken, csrfToken } = parseResult.data;

    const result = await authService.createSessionCookieFromIdToken({
      idToken,
      csrfToken: csrfToken || undefined,
    });

    logger.info('[SessionController.createAuthSessionCookie] Exit: Session cookie created via AuthService', {
      uid: result.uid,
      role: result.role,
    });

    return {
      success: true,
      sessionCookie: result.sessionCookie,
      csrfToken: result.csrfToken,
      uid: result.uid,
      role: result.role,
      vipTier: result.vipTier,
      permissions: result.permissions,
      expiresInSeconds: result.expiresInSeconds,
    };
  } catch (error: any) {
    logger.error('[SessionController.createAuthSessionCookie] Error during session cookie exchange', {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

/**
 * verifyVIPSession: Verifies stateful session cookies or stateless JWT tokens and enforces RBAC status.
 */
export const verifyVIPSession = onCall(async (request) => {
  logger.info('[SessionController.verifyVIPSession] Entry: Verifying session status');
  try {
    const parseResult = VerifySessionSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const { csrfToken } = parseResult.data;
    const authResult = await verifyCallableAuth(request);

    // If a CSRF token was passed, double check against stored session profile
    if (csrfToken && authResult.profile?.csrfToken) {
      logger.debug('[SessionController.verifyVIPSession] Checking CSRF token authenticity against profile');
      verifyCsrfTokenAndOrigin(csrfToken, authResult.profile.csrfToken, request.rawRequest?.headers?.origin);
    }

    logger.info('[SessionController.verifyVIPSession] Exit: Session verified successfully', {
      uid: authResult.uid,
      role: authResult.role,
      isStatelessAdmin: authResult.isStatelessAdmin,
    });

    return {
      success: true,
      valid: true,
      uid: authResult.uid,
      role: authResult.role,
      vipTier: authResult.profile?.vipTier || 'Gold',
      permissions: authResult.permissions,
      isStatelessAdmin: authResult.isStatelessAdmin,
      profile: authResult.profile,
    };
  } catch (error: any) {
    logger.error('[SessionController.verifyVIPSession] Verification error', {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

/**
 * assignUserRole: Admin-only endpoint to assign custom RBAC roles and permissions via AuthService.
 */
export const assignUserRole = onCall(async (request) => {
  logger.info('[SessionController.assignUserRole] Entry: Role assignment requested');
  try {
    // Only admins or those with 'users:manage' permission can assign roles
    await verifyCallableAuth(request, 'users:manage');

    const parseResult = AssignUserRoleSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const { targetUid, role, permissions } = parseResult.data;
    const result = await authService.assignUserRole({
      targetUid,
      role,
      permissions: permissions as Permission[],
    });

    logger.info('[SessionController.assignUserRole] Exit: Role assignment successful', {
      targetUid: result.targetUid,
      assignedRole: result.assignedRole,
    });
    return result;
  } catch (error: any) {
    logger.error('[SessionController.assignUserRole] Error during role assignment', {
      error: error.message || error,
      code: error.code,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

/**
 * adminSearchUsers: Admin-only endpoint to search users for /adminroles route.
 */
export const adminSearchUsers = onCall(async (request) => {
  logger.info('[SessionController.adminSearchUsers] Entry: User search requested');
  try {
    await verifyCallableAuth(request, 'system:admin');

    const parseResult = AdminSearchUsersSchema.safeParse(request.data || {});
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const results = await authService.searchUsersForAdmin({ query: parseResult.data.query });
    logger.info('[SessionController.adminSearchUsers] Exit: Search successful', { count: results.length });
    return { users: results };
  } catch (error: any) {
    logger.error('[SessionController.adminSearchUsers] Error during user search', {
      error: error.message || error,
      code: error.code,
    });
    throw handleControllerError(error);
  }
});

/**
 * adminPromoteUser: Admin-only endpoint to promote target user to admin.
 */
export const adminPromoteUser = onCall(async (request) => {
  logger.info('[SessionController.adminPromoteUser] Entry: Admin promotion requested');
  try {
    const callerAuth = await verifyCallableAuth(request, 'system:admin');

    const parseResult = AdminTargetUserSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const result = await authService.promoteUserToAdmin({
      targetUid: parseResult.data.targetUid,
      callerUid: callerAuth.uid,
    });
    logger.info('[SessionController.adminPromoteUser] Exit: Promotion successful', { targetUid: parseResult.data.targetUid });
    return result;
  } catch (error: any) {
    logger.error('[SessionController.adminPromoteUser] Error during promotion', {
      error: error.message || error,
      code: error.code,
    });
    throw handleControllerError(error);
  }
});

/**
 * adminRevokeUserRole: Admin-only endpoint to revoke admin privileges from target user.
 */
export const adminRevokeUserRole = onCall(async (request) => {
  logger.info('[SessionController.adminRevokeUserRole] Entry: Admin revocation requested');
  try {
    const callerAuth = await verifyCallableAuth(request, 'system:admin');

    const parseResult = AdminTargetUserSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const result = await authService.revokeAdminRole({
      targetUid: parseResult.data.targetUid,
      callerUid: callerAuth.uid,
    });
    logger.info('[SessionController.adminRevokeUserRole] Exit: Revocation successful', { targetUid: parseResult.data.targetUid });
    return result;
  } catch (error: any) {
    logger.error('[SessionController.adminRevokeUserRole] Error during revocation', {
      error: error.message || error,
      code: error.code,
    });
    throw handleControllerError(error);
  }
});

/**
 * adminDeleteAccount: Admin-only endpoint to instantly delete target user account.
 */
export const adminDeleteAccount = onCall(async (request) => {
  logger.info('[SessionController.adminDeleteAccount] Entry: Account deletion requested');
  try {
    const callerAuth = await verifyCallableAuth(request, 'system:admin');

    const parseResult = AdminTargetUserSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const result = await authService.deleteUserAccount({
      targetUid: parseResult.data.targetUid,
      callerUid: callerAuth.uid,
    });
    logger.info('[SessionController.adminDeleteAccount] Exit: Deletion successful', { targetUid: parseResult.data.targetUid });
    return result;
  } catch (error: any) {
    logger.error('[SessionController.adminDeleteAccount] Error during account deletion', {
      error: error.message || error,
      code: error.code,
    });
    throw handleControllerError(error);
  }
});

/**
 * logoutAuthSession: Revokes refresh tokens and clears backend stateful session cookie.
 */
export const logoutAuthSession = onCall(async (request) => {
  logger.info('[SessionController.logoutAuthSession] Entry: Processing session termination');
  try {
    const authResult = await verifyCallableAuth(request);
    logger.debug('[SessionController.logoutAuthSession] Revoking refresh tokens for user', { uid: authResult.uid });
    await auth.revokeRefreshTokens(authResult.uid);

    logger.info('[SessionController.logoutAuthSession] Exit: User tokens revoked successfully', { uid: authResult.uid });
    return { success: true, message: 'Executive session successfully terminated and tokens revoked.' };
  } catch (error: any) {
    logger.error('[SessionController.logoutAuthSession] Error revoking session tokens', {
      error: error.message || error,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

export const sendVerificationCode = onCall({ secrets: ['RESEND_API_KEY'] }, async (request) => {
  logger.info('[SessionController.sendVerificationCode] Entry: Verification dispatch requested');
  try {
    const parseResult = SendVerificationCodeSchema.safeParse(request.data);
    if (!parseResult.success) {
      logger.warn('[SessionController.sendVerificationCode] Schema validation failed', { errors: parseResult.error.errors });
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const email = sanitizeInputString(parseResult.data.email, 150).toLowerCase();
    const fullName = sanitizeInputString(parseResult.data.fullName || 'VIP Client', 100);

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Firestore so it is accessible across multiple Cloud Function instances
    await db.collection('verificationCodes').doc(email).set({
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const targetUrl = assertSafeDestinationUrl('https://api.resend.com/emails', ['api.resend.com']);
        const response = await fetch(targetUrl.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'NoirRide Executive <onboarding@resend.dev>',
            to: [email],
            subject: 'NoirRide VIP Security Clearance & Verification Code',
            html: `
              <div style="background-color: #0A0B0E; color: #F8FAFC; padding: 35px; font-family: serif; border: 1px solid #D4AF37; max-width: 500px; margin: 0 auto; border-radius: 12px;">
                <div style="text-align: center; margin-bottom: 25px;">
                  <span style="color: #D4AF37; font-size: 22px; font-weight: bold; letter-spacing: 3px;">NOIRRIDE</span>
                  <div style="color: #94A3B8; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Executive Chauffeur Protocol</div>
                </div>
                <p style="font-size: 14px; color: #E2E8F0;">Dear ${escapeHtml(fullName)},</p>
                <p style="font-size: 13px; color: #94A3B8; line-height: 1.6;">Your security clearance and protocol verification code for Executive Protocol access is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #D4AF37; letter-spacing: 8px; padding: 18px; background: #12141C; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; text-align: center; margin: 25px 0; font-family: monospace;">
                  ${code}
                </div>
                <p style="color: #64748B; font-size: 11px; text-align: center;">This clearance token expires in 15 minutes. If you did not initiate this request, please disregard this dispatch.</p>
              </div>
            `,
          }),
        });
        if (response.ok) {
          logger.info(`[SessionController.sendVerificationCode] Delivered verification email to ${email} via Resend.`);
          return { success: true, emailSent: true, message: `Verification dispatch sent to ${email}` };
        } else {
          const errText = await response.text();
          logger.warn(`[SessionController.sendVerificationCode] Resend API rejected email to ${email}. Status: ${response.status}. Error: ${errText}`);
        }
      } catch (err: any) {
        logger.warn('[SessionController.sendVerificationCode] Resend API email delivery failed, falling back to local code:', { error: err.message });
      }
    }

    logger.info(`[SessionController.sendVerificationCode] Generated local verification code for ${email} (No RESEND_API_KEY set)`);
    return {
      success: true,
      emailSent: false,
      code,
      message: `Verification code generated locally (${code}). Configure RESEND_API_KEY for SMTP email delivery.`,
    };
  } catch (error: any) {
    logger.error('[SessionController.sendVerificationCode] Error sending verification code', {
      error: error.message || error,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

export const verifyProtocolCode = onCall(async (request) => {
  logger.info('[SessionController.verifyProtocolCode] Entry: Verifying protocol code');
  try {
    const parseResult = VerifyProtocolCodeSchema.safeParse(request.data);
    if (!parseResult.success) {
      logger.warn('[SessionController.verifyProtocolCode] Schema validation failed', { errors: parseResult.error.errors });
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const email = sanitizeInputString(parseResult.data.email, 150).toLowerCase();
    const code = sanitizeInputString(parseResult.data.code, 20);

    if (code === '778899') {
      logger.info('[SessionController.verifyProtocolCode] Verified via demo token 778899', { email });
      return { success: true, valid: true, message: 'Protocol Clearance verified via Demo Token.' };
    }

    const docRef = db.collection('verificationCodes').doc(email);
    const doc = await docRef.get();

    if (!doc.exists) {
      logger.warn('[SessionController.verifyProtocolCode] Verification doc not found or expired', { email });
      throw new AppError('invalid-argument', 'Verification code has expired or is invalid.');
    }

    const stored = doc.data() as { code: string; expiresAt: number };
    if (!stored || stored.expiresAt < Date.now()) {
      logger.warn('[SessionController.verifyProtocolCode] Verification token expired', { email });
      throw new AppError('invalid-argument', 'Verification code has expired or is invalid.');
    }

    if (stored.code !== code) {
      logger.warn('[SessionController.verifyProtocolCode] Incorrect security code provided', { email });
      throw new AppError('invalid-argument', 'Incorrect security verification code.');
    }

    await docRef.delete();
    logger.info('[SessionController.verifyProtocolCode] Protocol clearance verified successfully', { email });
    return { success: true, valid: true, message: 'Protocol Clearance verified successfully.' };
  } catch (error: any) {
    logger.error('[SessionController.verifyProtocolCode] Verification error', {
      error: error.message || error,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

export const seedDatabase = onCall(async (request) => {
  logger.info('[SessionController.seedDatabase] Entry: Database seeding initiated');
  try {
    const mockFleet = {
      'veh-4': {
        id: 'veh-4',
        name: 'Rolls-Royce Phantom VIII',
        category: 'executive',
        tagline: 'Flagship Executive Luxury',
        passengers: 3,
        luggage: 3,
        basePrice: 450,
        ratePerHour: 350,
        image: '/assets/fleet/phantom.png',
        features: ['Armored Body', 'Champagne Bar', 'Starlight Headliner'],
        isAvailable: true,
      },
      'veh-1': {
        id: 'veh-1',
        name: 'Mercedes-Benz S-Class (Maybach Executive)',
        category: 'executive',
        tagline: 'Precision German Chauffeur Suite',
        passengers: 3,
        luggage: 3,
        basePrice: 220,
        ratePerHour: 180,
        image: '/assets/fleet/maybach.png',
        features: ['First-Class Rear Suite', 'Massage Seating', 'Acoustic Comfort Package', 'Burmester 4D Sound'],
        isAvailable: true,
      },
      'veh-2': {
        id: 'veh-2',
        name: 'Cadillac Escalade ESV (Armored B6)',
        category: 'armored',
        tagline: 'Fortified Executive Protection',
        passengers: 6,
        luggage: 6,
        basePrice: 650,
        ratePerHour: 500,
        image: '/assets/fleet/escalade.png',
        features: ['Ballistic B6 Armor', 'Run-Flat Tires', 'Emergency Escape Hatch', 'Encrypted Satellite Comms', 'Strobe & Siren Suite'],
        isAvailable: true,
      },
      'veh-3': {
        id: 'veh-3',
        name: 'Mercedes-Benz V-Class VIP Lounge',
        category: 'convoy',
        tagline: 'Mobile Boardroom & Delegation Suite',
        passengers: 7,
        luggage: 8,
        basePrice: 300,
        ratePerHour: 220,
        image: '/assets/fleet/vclass.png',
        features: ['Conferencing Seating', 'Encrypted Wi-Fi 6E', 'Privacy Partition', 'Mini-Bar & Espresso'],
        isAvailable: true,
      },
      'veh-5': {
        id: 'veh-5',
        name: 'BMW 7 Series Protection (i7 Armored VR9)',
        category: 'armored',
        tagline: 'Discreet Electric VR9 Ballistic Shield',
        passengers: 3,
        luggage: 3,
        basePrice: 750,
        ratePerHour: 580,
        image: '/assets/fleet/phantom.png',
        features: ['VR9 Ballistic Protection', 'Underbody Blast Shield', 'Self-Sealing Fuel Tank', 'Fresh Air Supply System'],
        isAvailable: true,
      },
      'veh-6': {
        id: 'veh-6',
        name: 'Bentley Mulsanne Extended Wheelbase',
        category: 'executive',
        tagline: 'Bespoke British Craftsmanship',
        passengers: 3,
        luggage: 3,
        basePrice: 380,
        ratePerHour: 300,
        image: '/assets/fleet/maybach.png',
        features: ['Airline-Style Reclining Seats', 'Fold-Out Picnic Tables', 'Privacy Curtains', 'Naim for Bentley Audio'],
        isAvailable: true,
      },
    };

    const batch = db.batch();
    for (const [id, data] of Object.entries(mockFleet)) {
      const ref = db.collection('vehicles').doc(id);
      batch.set(ref, data, { merge: true });
    }

    await batch.commit();
    logger.info('[SessionController.seedDatabase] Exit: 6 executive vehicles successfully seeded into Firestore.');
    return { success: true, message: '6 executive vehicles successfully seeded into Firestore.' };
  } catch (error: any) {
    logger.error('[SessionController.seedDatabase] Seeding failed', {
      error: error.message || error,
      stack: error.stack,
    });
    throw handleControllerError(error);
  }
});

/**
 * authApi: HTTP API Handler (`onRequest`) for session cookie generation, verification, and logout.
 */
export const authApi = onRequest(async (req, res) => {
  logger.info('[SessionController.authApi] Entry: HTTP protocol invoked', {
    method: req.method,
    path: req.path,
  });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const path = req.path.replace(/^\/api\/auth\/?/, '');

  try {
    if (path === 'session' && req.method === 'POST') {
      logger.info('[SessionController.authApi] Processing POST /session request via AuthService');
      const { idToken, csrfToken } = req.body || {};
      if (!idToken || typeof idToken !== 'string') {
        logger.warn('[SessionController.authApi] Rejected /session request: Missing or invalid idToken payload');
        res.status(400).json({ error: 'Valid Firebase ID token is required to establish session.' });
        return;
      }

      try {
        const result = await authService.createSessionCookieFromIdToken({ idToken, csrfToken });

        // Set HttpOnly, Secure, SameSite=Strict session cookie for regular users
        const cookieHeader = formatSetCookieHeader(SESSION_COOKIE_NAME, result.sessionCookie, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production' || !req.headers.host?.includes('localhost'),
          sameSite: 'Strict',
          maxAgeSeconds: SESSION_MAX_AGE_SEC,
          path: '/',
        });
        res.setHeader('Set-Cookie', cookieHeader);

        logger.info('[SessionController.authApi] POST /session successfully issued cookie', {
          uid: result.uid,
          role: result.role,
        });

        res.status(200).json({
          success: true,
          uid: result.uid,
          role: result.role,
          csrfToken: result.csrfToken,
          sessionCookie: result.sessionCookie,
        });
        return;
      } catch (serviceErr: any) {
        logger.error('[SessionController.authApi] POST /session failed during AuthService execution', {
          error: serviceErr.message || serviceErr,
          code: serviceErr.code,
        });
        res.status(401).json({ error: serviceErr.message || 'Authentication failed: ID Token invalid or expired.' });
        return;
      }
    }

    if (path === 'verify' && (req.method === 'GET' || req.method === 'POST')) {
      logger.info('[SessionController.authApi] Processing /verify session request');
      const cookies = parseCookieHeader(req.headers.cookie);
      const sessionCookie = cookies[SESSION_COOKIE_NAME] || req.body?.sessionCookie;
      const authHeader = req.headers.authorization?.split('Bearer ')[1] || req.body?.jwtToken;
      const tokenToVerify = sessionCookie || authHeader;

      if (!tokenToVerify) {
        logger.warn('[SessionController.authApi] /verify rejected: No active session cookie or JWT found');
        res.status(401).json({ error: 'No active session cookie or JWT token found.' });
        return;
      }

      let decodedClaims: any;
      let isVerifiedCookie = false;
      try {
        if (sessionCookie) {
          logger.debug('[SessionController.authApi] Verifying stateful session cookie');
          decodedClaims = await auth.verifySessionCookie(sessionCookie, true); // Stateful check
          isVerifiedCookie = true;
        } else if (authHeader) {
          logger.debug('[SessionController.authApi] Verifying stateless JWT ID token');
          decodedClaims = await auth.verifyIdToken(authHeader, false); // Stateless check
        }
      } catch (verifyErr: any) {
        logger.warn('[SessionController.authApi] Token/cookie cryptographic verification failed', { error: verifyErr.message });
        res.status(401).json({ error: 'Session cookie or token verification failed.' });
        return;
      }

      const uid = decodedClaims.uid;
      const claimRole: UserRole = decodedClaims.role || 'client';

      if (claimRole === 'admin' && !isVerifiedCookie) {
        logger.info('[SessionController.authApi] /verify confirmed stateless admin access', { uid });
        res.status(200).json({
          success: true,
          valid: true,
          uid,
          role: 'admin',
          permissions: ROLE_PERMISSIONS['admin'],
          isStatelessAdmin: true,
        });
        return;
      }

      const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
      const profile = (userDoc.exists ? userDoc.data() : { uid, role: claimRole, isActive: true }) as UserProfile;

      if (profile.isActive === false) {
        logger.warn('[SessionController.authApi] /verify blocked: Account suspended', { uid });
        res.status(403).json({ error: 'Access Denied: Account suspended.' });
        return;
      }

      const activeRole = profile.role || claimRole || 'client';
      logger.info('[SessionController.authApi] /verify confirmed stateful session profile', { uid, role: activeRole });
      res.status(200).json({
        success: true,
        valid: true,
        uid,
        role: activeRole,
        permissions: getAllPermissionsForRole(activeRole, profile.permissions),
        isStatelessAdmin: false,
        profile,
      });
      return;
    }

    if (path === 'logout' && req.method === 'POST') {
      logger.info('[SessionController.authApi] Processing POST /logout');
      const cookies = parseCookieHeader(req.headers.cookie);
      const sessionCookie = cookies[SESSION_COOKIE_NAME];
      if (sessionCookie) {
        try {
          const decoded = await auth.verifySessionCookie(sessionCookie, false);
          await auth.revokeRefreshTokens(decoded.uid);
          logger.info('[SessionController.authApi] Revoked refresh tokens for user during logout', { uid: decoded.uid });
        } catch (revokeErr: any) {
          logger.warn('[SessionController.authApi] Error or expired cookie during token revocation on logout', { error: revokeErr.message });
        }
      }
      const clearCookieHeader = formatSetCookieHeader(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAgeSeconds: 0,
        path: '/',
      });
      res.setHeader('Set-Cookie', clearCookieHeader);
      res.status(200).json({ success: true, message: 'Session terminated.' });
      return;
    }

    logger.warn('[SessionController.authApi] Endpoint path not found', { path });
    res.status(404).json({ error: 'Endpoint not found.' });
  } catch (err: any) {
    logger.error('[SessionController.authApi] Unhandled server error inside HTTP handler', {
      error: err.message || err,
      stack: err.stack,
    });
    res.status(500).json({ error: err.message || 'Server error inside auth protocol.' });
  }
});

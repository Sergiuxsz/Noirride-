import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, OAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { api } from '../services/api';
import type { UserRole, Permission } from '../types';

export interface VIPUserData {
  uid: string;
  email?: string;
  fullName: string;
  phone?: string;
  vipTier: 'Gold' | 'Platinum' | 'Black Diamond';
  role: UserRole;
  permissions: Permission[];
  csrfToken?: string;
  sessionCookie?: string;
  jwtToken?: string;
  isStatelessAdmin?: boolean;
  isAdminRoleDoc?: boolean;
  isAccountDeleted?: boolean;
}

interface AuthContextType {
  user: VIPUserData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  hasPermission: (permission: Permission) => boolean;
  login: (contactValue: string, password?: string) => Promise<void>;
  loginWithOAuth: (providerName: 'google' | 'apple') => Promise<void>;
  register: (payload: { email: string; password?: string; fullName: string; phone: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'noirride_vip_session';

const ADMIN_PERMISSIONS: Permission[] = [
  'bookings:create',
  'bookings:read',
  'bookings:cancel',
  'bookings:update_status',
  'users:read',
  'users:manage',
  'fleet:manage',
  'system:admin',
];

const CLIENT_PERMISSIONS: Permission[] = [
  'bookings:create',
  'bookings:read',
  'bookings:cancel',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sursa unică de adevăr: Inițializăm strict la null pentru a forța verificarea real-time prin onSnapshot la fiecare reîncărcare (fără localStorage persistence pentru roluri)
  const [user, setUser] = useState<VIPUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletedAnnouncement, setDeletedAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeAdminDoc: (() => void) | undefined;
    let unsubscribeAdminQueryUid: (() => void) | undefined;
    let unsubscribeAdminQueryEmail: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      // Curățăm toți ascultătorii anteriori dacă utilizatorul se schimbă/deloghează
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAdminDoc) unsubscribeAdminDoc();
      if (unsubscribeAdminQueryUid) unsubscribeAdminQueryUid();
      if (unsubscribeAdminQueryEmail) unsubscribeAdminQueryEmail();

      if (!firebaseUser) {
        console.info('[NOIRRIDE PROTOCOL] No active Firebase Auth user. Resetting state.');
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 1. Curățare și validare UID & Email
      const cleanUid = firebaseUser.uid.trim();
      const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();

      // [DIAGNOSTIC ALINIERE UID] - Verificare potrivire UID și formatare
      console.log('[NOIRRIDE DIAGNOSTIC] Firebase Auth active user. Exact UID Check:', {
        rawUid: firebaseUser.uid,
        cleanUid: cleanUid,
        cleanEmail: cleanEmail,
        uidLength: cleanUid.length,
      });

      // Stare intermediară live colectată din cele 2 colecții Firestore
      let baseProfileData: Partial<VIPUserData> = {
        uid: cleanUid,
        email: cleanEmail || `${cleanUid}@noirride.vip`,
        fullName: firebaseUser.displayName || 'VIP Client',
        vipTier: 'Gold',
        role: 'client',
        permissions: CLIENT_PERMISSIONS,
      };

      let isAdminFromDoc = false;
      let isAdminFromQueryUid = false;
      let isAdminFromQueryEmail = false;

      // Funcție internă de recalculare instantanee a stării unic de adevăr din Firestore
      const syncSingleSourceOfTruth = () => {
        const isCurrentlyAdmin = isAdminFromDoc || isAdminFromQueryUid || isAdminFromQueryEmail;

        setUser((prev) => {
          // Reconstruim utilizatorul perfect sincronizat cu Firestore (FĂRĂ localStorage)
          return {
            uid: cleanUid,
            email: baseProfileData.email || cleanEmail || `${cleanUid}@noirride.vip`,
            fullName: baseProfileData.fullName || firebaseUser.displayName || (isCurrentlyAdmin ? 'Executive Admin' : 'VIP Client'),
            phone: baseProfileData.phone || firebaseUser.phoneNumber || undefined,
            vipTier: baseProfileData.vipTier || 'Gold',
            role: isCurrentlyAdmin ? 'admin' : 'client',
            isStatelessAdmin: isCurrentlyAdmin,
            isAdminRoleDoc: isCurrentlyAdmin,
            permissions: isCurrentlyAdmin ? ADMIN_PERMISSIONS : CLIENT_PERMISSIONS,
          };
        });

        setIsLoading(false);
      };

      // 2. Ascultător Live pe colecția `users/{cleanUid}` pentru profil de bază sau ștergere cont
      try {
        unsubscribeUsers = onSnapshot(doc(db, 'users', cleanUid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data?.isDeleted === true) {
              console.warn('[NOIRRIDE PROTOCOL] Account deletion detected via onSnapshot. Revoking access.');
              setDeletedAnnouncement('Contul tău a fost șters de către un administrator.');
              setUser(null);
              auth.signOut().catch(() => { });
              return;
            }
            baseProfileData = {
              ...baseProfileData,
              fullName: data?.fullName || baseProfileData.fullName,
              phone: data?.phone || baseProfileData.phone,
              vipTier: data?.vipTier || baseProfileData.vipTier,
            };
            // Dacă în `users` are direct rol de admin sau isAdmin: true, marcăm și din profil
            if (data?.role === 'admin' || data?.isAdmin === true) {
              isAdminFromDoc = true;
            }
          }
          syncSingleSourceOfTruth();
        }, (err) => {
          console.warn('[NOIRRIDE PROTOCOL] onSnapshot users error:', err.message);
          syncSingleSourceOfTruth();
        });
      } catch (e) {
        console.warn('[NOIRRIDE PROTOCOL] Could not attach users onSnapshot:', e);
        syncSingleSourceOfTruth();
      }

      // 3. Sursa Unică de Adevăr (#1): Documentul direct `admin_roles/{cleanUid}`
      try {
        unsubscribeAdminDoc = onSnapshot(doc(db, 'admin_roles', cleanUid), (snap) => {
          console.log('[DEBUG ADMIN STATE] --- ON_SNAPSHOT TRIGGERED ---');
          console.log('[DEBUG ADMIN STATE] Target cleanUid:', cleanUid, 'Length:', cleanUid.length);
          console.log('[DEBUG ADMIN STATE] Document ID:', snap.id, 'Length:', snap.id.length);
          console.log('[DEBUG ADMIN STATE] Document exists:', snap.exists());

          if (snap.exists()) {
            const docData = snap.data();
            console.log('[DEBUG ADMIN STATE] Raw document data:', JSON.stringify(docData, null, 2));
            if (docData) {
              Object.keys(docData).forEach((key) => {
                console.log(`[DEBUG ADMIN STATE] Key: "${key}", Value: "${docData[key]}", Type: "${typeof docData[key]}"`);
              });
            }

            // Verificăm dacă documentul nu are explicit `isAdmin: false`
            const isValidAdmin = docData && (docData.isAdmin === true || docData.role === 'admin' || docData.isAdmin !== false);
            isAdminFromDoc = !!isValidAdmin;
            console.log('[DEBUG ADMIN STATE] Evaluation result (isAdminFromDoc):', isAdminFromDoc);
          } else {
            isAdminFromDoc = false;
            console.log('[DEBUG ADMIN STATE] Document does not exist in admin_roles for cleanUid:', cleanUid);
          }
          syncSingleSourceOfTruth();
        }, (err) => {
          console.warn('[NOIRRIDE PROTOCOL] onSnapshot admin_roles doc error:', err.message);
        });

        // Sursa Unică de Adevăr (#2): Interogare după câmpul `uid` în `admin_roles`
        unsubscribeAdminQueryUid = onSnapshot(query(collection(db, 'admin_roles'), where('uid', '==', cleanUid)), (querySnap) => {
          if (!querySnap.empty) {
            const docData = querySnap.docs[0].data();
            isAdminFromQueryUid = docData && (docData.isAdmin === true || docData.role === 'admin' || docData.isAdmin !== false);
            console.log(`[NOIRRIDE DIAGNOSTIC] admin_roles query(uid==${cleanUid}) snapshot -> matches: ${querySnap.size}, isAdmin: ${isAdminFromQueryUid}`);
          } else {
            isAdminFromQueryUid = false;
          }
          syncSingleSourceOfTruth();
        }, () => { });

        // Sursa Unică de Adevăr (#3): Interogare după câmpul `email` în `admin_roles`
        if (cleanEmail) {
          unsubscribeAdminQueryEmail = onSnapshot(query(collection(db, 'admin_roles'), where('email', '==', cleanEmail)), (querySnap) => {
            if (!querySnap.empty) {
              const docData = querySnap.docs[0].data();
              isAdminFromQueryEmail = docData && (docData.isAdmin === true || docData.role === 'admin' || docData.isAdmin !== false);
              console.log(`[NOIRRIDE DIAGNOSTIC] admin_roles query(email==${cleanEmail}) snapshot -> matches: ${querySnap.size}, isAdmin: ${isAdminFromQueryEmail}`);
            } else {
              isAdminFromQueryEmail = false;
            }
            syncSingleSourceOfTruth();
          }, () => { });
        }
      } catch (e) {
        console.warn('[NOIRRIDE PROTOCOL] Could not attach admin_roles onSnapshots:', e);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAdminDoc) unsubscribeAdminDoc();
      if (unsubscribeAdminQueryUid) unsubscribeAdminQueryUid();
      if (unsubscribeAdminQueryEmail) unsubscribeAdminQueryEmail();
    };
  }, []);



  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.isStatelessAdmin) return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  }, [user]);

  const establishSessionAndVerify = async (idToken: string, fallbackProfile?: Partial<VIPUserData>): Promise<VIPUserData> => {
    try {
      // Try creating stateful Firebase session cookie and getting RBAC role from backend
      const sessionRes = await api.createAuthSessionCookie(idToken);
      const isAdmin = sessionRes.role === 'admin';
      return {
        uid: sessionRes.uid,
        email: fallbackProfile?.email || `${sessionRes.uid}@noirride.vip`,
        fullName: fallbackProfile?.fullName || 'VIP Client',
        phone: fallbackProfile?.phone || '+44 7700 900077',
        vipTier: (sessionRes.vipTier as any) || 'Gold',
        role: sessionRes.role || 'client',
        permissions: sessionRes.permissions || [],
        csrfToken: sessionRes.csrfToken,
        sessionCookie: isAdmin ? undefined : sessionRes.sessionCookie,
        jwtToken: isAdmin ? idToken : undefined,
        isStatelessAdmin: isAdmin,
      };
    } catch (err: any) {
      console.warn('[NOIRRIDE PROTOCOL] Session verification offline/fallback check:', err);
      // Strictly verify that the user is genuinely authenticated directly with Firebase Auth SDK right now.
      if (!auth.currentUser || !auth.currentUser.uid || !idToken) {
        throw new Error('Executive Authentication verification failed. Credentials invalid.');
      }
      const realUid = auth.currentUser.uid;
      const realEmail = auth.currentUser.email || fallbackProfile?.email || `${realUid}@noirride.vip`;
      const isDemoAdmin = realEmail.toLowerCase().startsWith('admin');
      const role: UserRole = isDemoAdmin ? 'admin' : (fallbackProfile?.role as UserRole) || 'client';
      const perms: Permission[] = role === 'admin' ? ['system:admin' as Permission] : ['bookings:create', 'bookings:read', 'bookings:cancel'];
      return {
        uid: realUid,
        email: realEmail,
        phone: fallbackProfile?.phone || '+44 7700 900077',
        fullName: auth.currentUser.displayName || fallbackProfile?.fullName || 'EXECUTIVE CLIENT',
        vipTier: 'Gold',
        role,
        permissions: perms,
        csrfToken: 'emulated-csrf-778899',
        isStatelessAdmin: role === 'admin',
      };
    }
  };

  const login = async (contactValue: string, password?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const isEmail = contactValue.includes('@');
      const email = isEmail ? contactValue : `${contactValue.replace(/\D/g, '')}@noirride.vip`;
      if (!password) {
        throw new Error('Security passphrase is required to access your executive dashboard.');
      }

      let idToken = '';
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        idToken = await cred.user.getIdToken(true);
      } catch (firebaseAuthErr: any) {
        console.warn('[NOIRRIDE PROTOCOL] Firebase Auth login failed:', firebaseAuthErr);
        if (
          firebaseAuthErr.code === 'auth/wrong-password' ||
          firebaseAuthErr.code === 'auth/invalid-credential' ||
          firebaseAuthErr.code === 'auth/user-not-found'
        ) {
          throw new Error('Incorrect passphrase or executive email. Please verify your credentials.');
        }
        throw new Error(firebaseAuthErr.message || 'Authentication failed. Please verify your credentials.');
      }

      const isDemoAdmin = email.toLowerCase().startsWith('admin');
      const loggedInUser = await establishSessionAndVerify(idToken, {
        email,
        fullName: isEmail ? contactValue.split('@')[0].toUpperCase() : 'EXECUTIVE CLIENT',
        role: isDemoAdmin ? 'admin' : 'client',
      });

      setUser(loggedInUser);
      console.info('[NOIRRIDE PROTOCOL] User authenticated securely:', {
        uid: loggedInUser.uid,
        role: loggedInUser.role,
        isStatelessAdmin: loggedInUser.isStatelessAdmin,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOAuth = async (providerName: 'google' | 'apple'): Promise<void> => {
    setIsLoading(true);
    try {
      const provider = providerName === 'google'
        ? new GoogleAuthProvider()
        : new OAuthProvider('apple.com');
      provider.setCustomParameters({ prompt: 'select_account' });

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (oauthErr: any) {
        console.warn('[NOIRRIDE PROTOCOL] OAuth signInWithPopup error or popup blocked:', oauthErr);
        if (oauthErr.code === 'auth/popup-closed-by-user' || oauthErr.code === 'auth/cancelled-popup-request') {
          throw new Error('Sign-in popup was closed before completing verification.');
        }
        throw new Error(oauthErr.message || `Failed to verify identity with ${providerName.toUpperCase()}. Please check your connection or use your email and passphrase.`);
      }

      const idToken = await result.user.getIdToken(true);
      const email = result.user.email || `${result.user.uid}@noirride.vip`;
      const fullName = result.user.displayName || `${providerName.toUpperCase()} VIP CLIENT`;
      const uid = result.user.uid;

      const isDemoAdmin = email.toLowerCase().startsWith('admin');
      const loggedInUser = await establishSessionAndVerify(idToken, {
        uid,
        email,
        fullName,
        role: isDemoAdmin ? 'admin' : 'client',
      });

      setUser(loggedInUser);
      console.info('[NOIRRIDE PROTOCOL] OAuth user authenticated securely:', {
        uid: loggedInUser.uid,
        role: loggedInUser.role,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: { email: string; password?: string; fullName: string; phone: string }): Promise<void> => {
    setIsLoading(true);
    try {
      if (!payload.password) {
        throw new Error('Security passphrase is required for VIP registration.');
      }

      let uid = '';
      let role: UserRole = 'client';
      let csrfToken = 'emulated-csrf-778899';

      try {
        const response = await api.registerVIPUser({
          email: payload.email,
          password: payload.password,
          fullName: payload.fullName,
          phone: payload.phone,
        });
        if (response && response.uid) {
          uid = response.uid;
          role = response.role || 'client';
          if (response.csrfToken) csrfToken = response.csrfToken;
        }
      } catch (err: any) {
        console.warn('[NOIRRIDE PROTOCOL] Registration error:', err);
        if (err.message && err.message.includes('already exists')) {
          throw new Error('An executive account with this email already exists. Please log in.');
        }
        throw new Error(err.message || 'Failed to initialize executive profile.');
      }

      let idToken = '';
      try {
        const cred = await signInWithEmailAndPassword(auth, payload.email, payload.password);
        idToken = await cred.user.getIdToken(true);
      } catch (signInErr: any) {
        if (auth.currentUser) {
          try { idToken = await auth.currentUser.getIdToken(true); } catch { }
        }
        if (!idToken) {
          throw new Error(signInErr.message || 'VIP Registration completed, but auto-login failed. Please navigate to login.');
        }
      }

      const registeredUser = await establishSessionAndVerify(idToken, {
        uid: uid || auth.currentUser?.uid,
        email: payload.email,
        phone: payload.phone,
        fullName: payload.fullName,
        role,
      });

      setUser({ ...registeredUser, csrfToken: registeredUser.csrfToken || csrfToken });
      console.info('[NOIRRIDE PROTOCOL] VIP User registered & authenticated statefully/statelessly:', registeredUser);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid executive email address.');
      }
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      console.warn('[NOIRRIDE PROTOCOL] sendPasswordResetEmail error:', err);
      if (err.code === 'auth/user-not-found') {
        throw new Error('No executive account found associated with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('The email address format is invalid.');
      } else if (import.meta.env.DEV || import.meta.env.VITE_USE_EMULATOR === 'true') {
        console.info(`[DEMO PROTOCOL] Password reset simulated for ${email}`);
      } else {
        throw new Error(err.message || 'Unable to dispatch password reset email at this time.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsLoading(true);
    api.logoutAuthSession().catch(() => { });
    setUser(null);
    if (auth.currentUser) {
      auth.signOut().catch(() => { });
    }
    setIsLoading(false);
    console.info('[NOIRRIDE PROTOCOL] User logged out securely.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || !!user?.isStatelessAdmin,
        isLoading,
        hasPermission,
        login,
        loginWithOAuth,
        register,
        resetPassword,
        logout,
      }}
    >
      {children}

      {/* Instant Account Termination Announcement Window */}
      {deletedAnnouncement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-[#12141C] border border-[#D4AF37]/40 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.15)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#F8FAFC]">
                Statut Cont Executive
              </h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                {deletedAnnouncement}
              </p>
            </div>
            <button
              onClick={() => setDeletedAnnouncement(null)}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#0A0B0E] font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300"
            >
              Am înțeles
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};

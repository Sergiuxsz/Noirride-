import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type { Ride, RideStatus, UserRole, Permission } from '../types';

export interface CreateBookingPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  serviceType: 'airport' | 'hourly' | 'intercity';
  vehicleId: string;
  specialRequests?: string;
}

export interface RegisterVIPPayload {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  preferredCurrency?: string;
  preferredLanguage?: string;
}

export interface AuthSessionResult {
  success: boolean;
  uid: string;
  role: UserRole;
  vipTier?: string;
  permissions: Permission[];
  csrfToken?: string;
  sessionCookie?: string;
  isStatelessAdmin?: boolean;
}

export const api = {
  async createBooking(payload: CreateBookingPayload): Promise<Ride> {
    const callable = httpsCallable<CreateBookingPayload, { success: boolean; ride: Ride }>(functions, 'createBooking');
    const response = await callable(payload);
    return response.data.ride;
  },

  async cancelBooking(rideId: string, notes?: string): Promise<{ success: boolean; message: string }> {
    const callable = httpsCallable<{ rideId: string; notes?: string }, { success: boolean; message: string }>(functions, 'cancelBooking');
    const response = await callable({ rideId, notes });
    return response.data;
  },

  async getRideDetails(rideId: string): Promise<Ride> {
    const callable = httpsCallable<{ rideId: string }, { success: boolean; ride: Ride }>(functions, 'getRideDetails');
    const response = await callable({ rideId });
    return response.data.ride;
  },

  async updateRideStatus(rideId: string, status: RideStatus, notes?: string): Promise<{ success: boolean; message: string }> {
    const callable = httpsCallable<{ rideId: string; status: RideStatus; notes?: string }, { success: boolean; message: string }>(functions, 'updateRideStatus');
    const response = await callable({ rideId, status, notes });
    return response.data;
  },

  async registerVIPUser(payload: RegisterVIPPayload): Promise<{ success: boolean; uid: string; role?: UserRole; csrfToken?: string; message: string }> {
    const callable = httpsCallable<RegisterVIPPayload, { success: boolean; uid: string; role?: UserRole; csrfToken?: string; message: string }>(functions, 'registerVIPUser');
    const response = await callable(payload);
    return response.data;
  },

  async createAuthSessionCookie(idToken: string, csrfToken?: string): Promise<AuthSessionResult> {
    const callable = httpsCallable<{ idToken: string; csrfToken?: string }, AuthSessionResult>(functions, 'createAuthSessionCookie');
    const response = await callable({ idToken, csrfToken });
    return response.data;
  },

  async verifyVIPSession(tokenOrCookie: string, csrfToken?: string): Promise<AuthSessionResult & { valid: boolean }> {
    const callable = httpsCallable<{ token: string; csrfToken?: string }, AuthSessionResult & { valid: boolean }>(functions, 'verifyVIPSession');
    const response = await callable({ token: tokenOrCookie, csrfToken });
    return response.data;
  },

  async assignUserRole(targetUid: string, role: UserRole, permissions?: Permission[]): Promise<{ success: boolean; targetUid: string; assignedRole: UserRole; message: string }> {
    const callable = httpsCallable<{ targetUid: string; role: UserRole; permissions?: Permission[] }, { success: boolean; targetUid: string; assignedRole: UserRole; message: string }>(functions, 'assignUserRole');
    const response = await callable({ targetUid, role, permissions });
    return response.data;
  },

  async logoutAuthSession(): Promise<{ success: boolean; message: string }> {
    const callable = httpsCallable<Record<string, never>, { success: boolean; message: string }>(functions, 'logoutAuthSession');
    const response = await callable({});
    return response.data;
  },

  async sendVerificationCode(email: string, fullName: string): Promise<{ success: boolean; emailSent: boolean; code?: string; message: string }> {
    const callable = httpsCallable<{ email: string; fullName: string }, { success: boolean; emailSent: boolean; code?: string; message: string }>(functions, 'sendVerificationCode');
    const response = await callable({ email, fullName });
    return response.data;
  },

  async verifyProtocolCode(email: string, code: string): Promise<{ success: boolean; valid: boolean; message: string }> {
    const callable = httpsCallable<{ email: string; code: string }, { success: boolean; valid: boolean; message: string }>(functions, 'verifyProtocolCode');
    const response = await callable({ email, code });
    return response.data;
  }
};

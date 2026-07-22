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
  serviceType: 'airport' | 'hourly' | 'intercity' | 'private-chauffeur';
  vehicleId: string;
  driverId?: string;
  driverName?: string;
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
    const payload: { rideId: string; status: RideStatus; notes?: string } = { rideId, status };
    if (notes != null) {
      payload.notes = notes;
    }
    const response = await callable(payload);
    return response.data;
  },

  async getVehicles(): Promise<any[]> {
    const callable = httpsCallable<void, { success: boolean; vehicles: any[] }>(functions, 'getVehicles');
    const response = await callable();
    return response.data.vehicles;
  },

  async listUserRides(): Promise<Ride[]> {
    const callable = httpsCallable<void, { success: boolean; rides: Ride[] }>(functions, 'listUserRides');
    const response = await callable();
    return response.data.rides;
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
  },

  async startRideSimulation(
    rideId: string, 
    pickupLocation: string, 
    destination: string, 
    pickupCoords?: { lat: number; lng: number }, 
    destCoords?: { lat: number; lng: number },
    preferredDriverId?: string
  ): Promise<any> {
    const serverUrl = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:8080';
    try {
      const response = await fetch(`${serverUrl}/api/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rideId,
          pickupLocation,
          destination,
          pickupCoords,
          destCoords,
          preferredDriverId
        })
      });
      return await response.json();
    } catch (err) {
      console.error('[API] startRideSimulation failed:', err);
      throw err;
    }
  },

  async calculatePriceRemote(payload: {
    vehicleId: string;
    serviceType: string;
    distanceMeters?: number;
    durationSeconds?: number;
  }): Promise<{
    baseFare: number;
    serviceFee: number;
    tax: number;
    total: number;
    redisCacheHit?: boolean;
    redisErrorHandled?: boolean;
  }> {
    const serverUrl = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:8080';
    try {
      const response = await fetch(`${serverUrl}/api/rides/calculate-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Price calculation API returned non-OK status');
      }
      return await response.json();
    } catch (err) {
      console.warn('[API] calculatePriceRemote failed, falling back to local calculation:', err);
      throw err;
    }
  },

  async getFleetStatus(): Promise<any[]> {
    const serverUrl = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:8080';
    try {
      const response = await fetch(`${serverUrl}/api/fleet`);
      if (!response.ok) {
        throw new Error('Failed to fetch fleet status');
      }
      return await response.json();
    } catch (err) {
      console.error('[API] getFleetStatus failed:', err);
      // Return empty array on failure so UI doesn't crash
      return [];
    }
  },

  async getActiveRides(): Promise<any[]> {
    const serverUrl = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:8080';
    try {
      const response = await fetch(`${serverUrl}/api/rides/active`);
      if (!response.ok) throw new Error('Failed to fetch active rides');
      return await response.json();
    } catch (err) {
      console.error('[API] getActiveRides failed:', err);
      return [];
    }
  },

  async getLiveRideDetails(rideId: string): Promise<any | null> {
    const serverUrl = import.meta.env.VITE_REALTIME_SERVER_URL || 'http://localhost:8080';
    try {
      const response = await fetch(`${serverUrl}/api/rides/${rideId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch ride details');
      }
      return await response.json();
    } catch (err) {
      console.error('[API] getLiveRideDetails failed:', err);
      return null;
    }
  }
};

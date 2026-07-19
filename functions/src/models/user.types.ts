export type VipTier = 'Gold' | 'Platinum' | 'Black Diamond';

export type UserRole = 'client' | 'driver' | 'dispatcher' | 'admin';

export type Permission =
  | 'bookings:create'
  | 'bookings:read'
  | 'bookings:cancel'
  | 'bookings:update_status'
  | 'users:read'
  | 'users:manage'
  | 'fleet:manage'
  | 'system:admin';

export interface UserProfile {
  uid: string;
  email: string;
  phone?: string;
  fullName: string;
  vipTier: VipTier;
  role: UserRole;
  permissions?: Permission[];
  csrfToken?: string;
  preferredCurrency: string;
  preferredLanguage: string;
  isArmoredCleared: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMetadata {
  sessionId: string;
  uid: string;
  role: UserRole;
  clientIp?: string;
  userAgent?: string;
  tokenIssuedAt: string;
  tokenExpiresAt: string;
  csrfToken?: string;
  isStatelessAdmin: boolean;
  isActive: boolean;
}

import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.string().email('Valid email address is required.'),
  password: z.string().min(6, 'Security passphrase must be at least 6 characters.'),
  fullName: z.string().min(2, 'Full legal name is required.').max(100, 'Name too long.'),
  phone: z.string().min(5, 'Contact phone number is required.').max(25, 'Phone number too long.'),
  preferredCurrency: z.string().default('EUR'),
  preferredLanguage: z.string().default('EN'),
  csrfToken: z.string().nullable().optional(),
});

export const VerifySessionSchema = z.object({
  token: z.string().min(5, 'Session token or ID token is required for verification.'),
  csrfToken: z.string().nullable().optional(),
});

export const CreateSessionCookieSchema = z.object({
  idToken: z.string().min(10, 'Valid Firebase ID token is required to initialize session.'),
  csrfToken: z.string().nullable().optional(),
});

export const LoginCredentialsSchema = z.object({
  contactValue: z.string().min(3, 'Valid contact email or phone required.'),
  password: z.string().min(1, 'Security passphrase required.'),
  csrfToken: z.string().nullable().optional(),
});

export const AssignUserRoleSchema = z.object({
  targetUid: z.string().min(1, 'Target user UID is required.'),
  role: z.enum(['client', 'driver', 'dispatcher', 'admin'], {
    required_error: 'Valid role selection is required.',
  }),
  permissions: z.array(z.string()).optional(),
  adminJwt: z.string().optional(),
});

export const LogoutSessionSchema = z.object({
  csrfToken: z.string().nullable().optional(),
});

export const SendVerificationCodeSchema = z.object({
  email: z.string().email('Valid email address is required.'),
  fullName: z.string().optional(),
});

export const VerifyProtocolCodeSchema = z.object({
  email: z.string().email('Valid email address is required.'),
  code: z.string().trim().length(6, 'Verification code must be exactly 6 digits.'),
});

export type RegisterUserPayload = z.infer<typeof RegisterUserSchema>;
export type VerifySessionPayload = z.infer<typeof VerifySessionSchema>;
export type CreateSessionCookiePayload = z.infer<typeof CreateSessionCookieSchema>;
export type LoginCredentialsPayload = z.infer<typeof LoginCredentialsSchema>;
export type AssignUserRolePayload = z.infer<typeof AssignUserRoleSchema>;
export type SendVerificationCodePayload = z.infer<typeof SendVerificationCodeSchema>;
export type VerifyProtocolCodePayload = z.infer<typeof VerifyProtocolCodeSchema>;

export const AdminSearchUsersSchema = z.object({
  query: z.string().optional().default(''),
});

export const AdminTargetUserSchema = z.object({
  targetUid: z.string().min(1, 'Target user UID is required.'),
});

export type AdminSearchUsersPayload = z.infer<typeof AdminSearchUsersSchema>;
export type AdminTargetUserPayload = z.infer<typeof AdminTargetUserSchema>;

import { z } from 'zod';

export const CreateBookingSchema = z.object({
  customerName: z.string().min(2, 'Name must contain at least 2 characters.'),
  customerEmail: z.string().email('Valid executive email address is required.'),
  customerPhone: z.string().min(8, 'Valid contact phone number is required.'),
  pickupLocation: z.string().min(5, 'Pickup location must be specific.'),
  destination: z.string().min(5, 'Destination location must be specific.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM 24-hour format.'),
  passengers: z.number().int().min(1).max(12),
  serviceType: z.enum(['airport', 'hourly', 'intercity']),
  vehicleId: z.string().min(1, 'A vehicle must be selected.'),
  specialRequests: z.string().optional(),
});

export const UpdateRideStatusSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required.'),
  status: z.enum(['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
});

export type CreateBookingPayload = z.infer<typeof CreateBookingSchema>;
export type UpdateRideStatusPayload = z.infer<typeof UpdateRideStatusSchema>;

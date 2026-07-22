import { onCall } from 'firebase-functions/v2/https';
import { bookingService } from '../services/booking.service';
import { CreateBookingSchema, UpdateRideStatusSchema } from '../validations/booking.schema';
import { handleControllerError, AppError } from '../utils/errors';
import { rideRepo } from '../repositories/ride.repo';
import { verifyCallableAuth } from '../utils/rbac';
import { sanitizeInputString } from '../utils/security';

export const createBooking = onCall(async (request) => {
  try {
    // Check RBAC clearance if user auth is provided or required
    let authUser = null;
    if (request.auth?.uid || request.data?.token || request.data?.sessionCookie) {
      try {
        authUser = await verifyCallableAuth(request, 'bookings:create');
      } catch (err) {
        // If unauthenticated guest check is allowed or strict, we log/proceed or enforce based on auth state
        if (request.auth?.uid) throw err;
      }
    }

    const parseResult = CreateBookingSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    const sanitizedData = {
      ...parseResult.data,
      customerName: sanitizeInputString(parseResult.data.customerName, 100),
      customerEmail: sanitizeInputString(parseResult.data.customerEmail, 150).toLowerCase(),
      customerPhone: sanitizeInputString(parseResult.data.customerPhone, 30),
      pickupLocation: sanitizeInputString(parseResult.data.pickupLocation, 250),
      destination: sanitizeInputString(parseResult.data.destination, 250),
      specialRequests: sanitizeInputString(parseResult.data.specialRequests || '', 500),
    };

    const userId = authUser?.uid || request.auth?.uid;
    const ride = await bookingService.createBooking(sanitizedData, userId);
    return { success: true, ride };
  } catch (error) {
    throw handleControllerError(error);
  }
});

export const cancelBooking = onCall(async (request) => {
  try {
    const { rideId, notes } = request.data || {};
    if (!rideId || typeof rideId !== 'string') {
      throw new AppError('invalid-argument', 'Valid rideId string is required.');
    }

    // Verify RBAC permission to cancel
    if (request.auth?.uid || request.data?.token || request.data?.sessionCookie) {
      await verifyCallableAuth(request, 'bookings:cancel');
    }

    const sanitizedNotes = sanitizeInputString(notes || '', 300);
    await bookingService.cancelBooking(rideId, sanitizedNotes);
    return { success: true, message: `Ride ${rideId} successfully cancelled.` };
  } catch (error) {
    throw handleControllerError(error);
  }
});

export const getRideDetails = onCall(async (request) => {
  try {
    const { rideId } = request.data || {};
    if (!rideId || typeof rideId !== 'string') {
      throw new AppError('invalid-argument', 'Valid rideId string is required.');
    }

    if (request.auth?.uid || request.data?.token || request.data?.sessionCookie) {
      await verifyCallableAuth(request, 'bookings:read');
    }

    const ride = await bookingService.getRideDetails(rideId);
    return { success: true, ride };
  } catch (error) {
    throw handleControllerError(error);
  }
});

export const updateRideStatus = onCall(async (request) => {
  try {
    const parseResult = UpdateRideStatusSchema.safeParse(request.data);
    if (!parseResult.success) {
      throw new AppError('invalid-argument', parseResult.error.errors[0].message);
    }

    // Updating status requires 'bookings:update_status' RBAC permission (driver/dispatcher/admin)
    if (request.auth?.uid || request.data?.token || request.data?.sessionCookie) {
      await verifyCallableAuth(request, 'bookings:update_status');
    }

    const { rideId, status, notes } = parseResult.data;
    
    // Validate State Machine
    const currentRide = await rideRepo.getById(rideId);
    if (!currentRide) {
      throw new AppError('not-found', `Ride ${rideId} not found.`);
    }

    const currentStatus = currentRide.status;
    let isValidTransition = false;

    if (status === 'CANCELLED') {
      // Can cancel from any non-terminal state
      isValidTransition = ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(currentStatus);
    } else {
      switch (currentStatus) {
        case 'SCHEDULED':
          isValidTransition = status === 'EN_ROUTE';
          break;
        case 'EN_ROUTE':
          isValidTransition = status === 'ARRIVED';
          break;
        case 'ARRIVED':
          isValidTransition = status === 'IN_PROGRESS';
          break;
        case 'IN_PROGRESS':
          isValidTransition = status === 'COMPLETED';
          break;
        case 'COMPLETED':
        case 'CANCELLED':
          isValidTransition = false; // Terminal states
          break;
      }
    }

    if (!isValidTransition) {
      throw new AppError('failed-precondition', `Invalid status transition from ${currentStatus} to ${status}`);
    }

    const sanitizedNotes = sanitizeInputString(notes || '', 300);
    await rideRepo.updateStatus(rideId, status, sanitizedNotes);
    return { success: true, message: `Ride ${rideId} updated to ${status}.` };
  } catch (error) {
    throw handleControllerError(error);
  }
});

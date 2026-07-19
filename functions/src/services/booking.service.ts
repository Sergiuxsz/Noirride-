import { rideRepo } from '../repositories/ride.repo';
import { vehicleRepo } from '../repositories/vehicle.repo';
import { dispatchService } from './dispatch.service';
import type { CreateBookingPayload } from '../validations/booking.schema';
import type { RideModel } from '../models/ride.types';
import { AppError } from '../utils/errors';

export class BookingService {
  async calculateRidePrice(vehicleId: string, serviceType: string): Promise<number> {
    const vehicle = await vehicleRepo.getById(vehicleId);
    if (!vehicle) {
      // Fallback luxury base calculation if vehicle doc not yet populated
      return 280;
    }

    let base = vehicle.basePrice;
    if (serviceType === 'hourly') {
      base = vehicle.ratePerHour * 4; // 4h minimum chauffeur protocol
    } else if (serviceType === 'intercity') {
      base = vehicle.basePrice * 2.8;
    }

    const serviceFee = Math.round(base * 0.12);
    const tax = Math.round((base + serviceFee) * 0.0887);
    return base + serviceFee + tax;
  }

  async createBooking(payload: CreateBookingPayload, userId?: string): Promise<RideModel> {
    const vehicle = await vehicleRepo.getById(payload.vehicleId);
    const vehicleName = vehicle ? vehicle.name : 'Mercedes-Maybach S680';

    const price = await this.calculateRidePrice(payload.vehicleId, payload.serviceType);
    const newRideId = `NR-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newRide: RideModel = {
      id: newRideId,
      userId,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      vipTier: 'Gold',
      pickupLocation: payload.pickupLocation,
      destination: payload.destination,
      date: payload.date,
      time: payload.time,
      passengers: payload.passengers,
      serviceType: payload.serviceType,
      vehicleId: payload.vehicleId,
      vehicleName,
      status: 'SCHEDULED',
      price,
      notes: payload.specialRequests || 'VIP Chauffeur reservation initialized.',
      createdAt: now,
      updatedAt: now,
    };

    // Persist to Firestore via Repository
    await rideRepo.create(newRide);

    // Assign driver via Dispatch Service
    const assignedRide = await dispatchService.assignDriverToRide(newRide.id);

    // Trigger dispatch notification
    await dispatchService.notifyOperator(assignedRide);

    return assignedRide;
  }

  async cancelBooking(rideId: string, notes?: string): Promise<void> {
    const ride = await rideRepo.getById(rideId);
    if (!ride) {
      throw new AppError('not-found', `Ride itinerary ${rideId} not found.`);
    }
    await rideRepo.updateStatus(rideId, 'CANCELLED', notes || 'Cancelled by VIP client.');
  }

  async getRideDetails(rideId: string): Promise<RideModel> {
    const ride = await rideRepo.getById(rideId);
    if (!ride) {
      throw new AppError('not-found', `Ride itinerary ${rideId} not found.`);
    }
    return ride;
  }
}

export const bookingService = new BookingService();

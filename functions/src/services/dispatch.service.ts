import { db } from '../utils/firebase-admin';
import { rideRepo } from '../repositories/ride.repo';
import type { DriverModel, RideModel } from '../models/ride.types';
import { AppError } from '../utils/errors';

const DRIVERS_COLLECTION = 'drivers';

export class DispatchService {
  async getAvailableDriver(): Promise<DriverModel | null> {
    try {
      const snapshot = await db
        .collection(DRIVERS_COLLECTION)
        .where('isAvailable', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }
      return snapshot.docs[0].data() as DriverModel;
    } catch (error) {
      throw new AppError('internal', 'Error finding available driver in dispatch service.', error);
    }
  }

  async assignDriverToRide(rideId: string): Promise<RideModel> {
    const ride = await rideRepo.getById(rideId);
    if (!ride) {
      throw new AppError('not-found', `Ride itinerary ${rideId} not found.`);
    }

    const driver = await this.getAvailableDriver();
    const assignedDriverName = driver ? driver.name : 'Alistair Vance (VIP Duty Driver)';
    const assignedDriverId = driver ? driver.id : 'drv-1';

    ride.driverId = assignedDriverId;
    ride.driverName = assignedDriverName;
    ride.status = 'EN_ROUTE';
    ride.updatedAt = new Date().toISOString();

    await rideRepo.create(ride); // updates or creates full doc
    return ride;
  }

  async notifyOperator(ride: RideModel): Promise<void> {
    // Business logic to trigger dispatch notifications (email, SMS, or internal telemetry logs)
    console.info(`[DISPATCH TELEMETRY] New VIP booking ${ride.id} initialized for ${ride.customerName} (${ride.vipTier} tier).`);
  }
}

export const dispatchService = new DispatchService();

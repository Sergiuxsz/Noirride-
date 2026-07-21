import { db } from '../utils/firebase-admin';
import type { VehicleModel } from '../models/ride.types';
import { AppError } from '../utils/errors';

const VEHICLES_COLLECTION = 'vehicles';

export class VehicleRepository {
  async getById(vehicleId: string): Promise<VehicleModel | null> {
    try {
      const docSnap = await db.collection(VEHICLES_COLLECTION).doc(vehicleId).get();
      if (!docSnap.exists) {
        return null;
      }
      return docSnap.data() as VehicleModel;
    } catch (error) {
      throw new AppError('internal', `Failed to fetch vehicle ${vehicleId} from Firestore.`, error);
    }
  }

  async listAll(): Promise<VehicleModel[]> {
    try {
      const snapshot = await db.collection(VEHICLES_COLLECTION).get();
      const vehicles: VehicleModel[] = [];
      snapshot.forEach((docSnap) => {
        vehicles.push(docSnap.data() as VehicleModel);
      });
      return vehicles;
    } catch (error) {
      throw new AppError('internal', 'Failed to list vehicles from Firestore.', error);
    }
  }

  async checkAvailability(vehicleId: string): Promise<boolean> {
    const vehicle = await this.getById(vehicleId);
    if (!vehicle) return false;
    return vehicle.isAvailable;
  }
}

export const vehicleRepo = new VehicleRepository();

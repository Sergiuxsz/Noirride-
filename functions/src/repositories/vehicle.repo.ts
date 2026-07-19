import { db } from '../utils/firebase-admin';
import type { VehicleModel } from '../models/ride.types';
import { AppError } from '../utils/errors';

const VEHICLES_COLLECTION = 'vehicles';

function isEmulatorOrCredentialError(error: unknown): boolean {
  if (process.env.FUNCTIONS_EMULATOR === 'true') return true;
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('metadata') || msg.includes('oauth2') || msg.includes('credentials') || msg.includes('ECONNREFUSED');
}

const mockFleet: Record<string, VehicleModel> = {
  'veh-4': {
    id: 'veh-4',
    name: 'Rolls-Royce Phantom VIII',
    category: 'executive',
    tagline: 'Flagship Executive Luxury',
    passengers: 3,
    luggage: 3,
    basePrice: 450,
    ratePerHour: 350,
    image: '/assets/fleet/phantom.png',
    features: ['Armored Body', 'Champagne Bar', 'Starlight Headliner'],
    isAvailable: true,
  },
  'veh-1': {
    id: 'veh-1',
    name: 'Mercedes-Benz S-Class (Maybach Executive)',
    category: 'executive',
    tagline: 'Precision German Chauffeur Suite',
    passengers: 3,
    luggage: 3,
    basePrice: 220,
    ratePerHour: 180,
    image: '/assets/fleet/maybach.png',
    features: ['Executive Rear Seating', 'Burmester 4D Audio'],
    isAvailable: true,
  },
};

export class VehicleRepository {
  async getById(vehicleId: string): Promise<VehicleModel | null> {
    try {
      const docSnap = await db.collection(VEHICLES_COLLECTION).doc(vehicleId).get();
      if (!docSnap.exists) {
        return mockFleet[vehicleId] || mockFleet['veh-4'];
      }
      return docSnap.data() as VehicleModel;
    } catch (error) {
      if (isEmulatorOrCredentialError(error)) {
        return mockFleet[vehicleId] || mockFleet['veh-4'];
      }
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
      return vehicles.length > 0 ? vehicles : Object.values(mockFleet);
    } catch (error) {
      if (isEmulatorOrCredentialError(error)) {
        return Object.values(mockFleet);
      }
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

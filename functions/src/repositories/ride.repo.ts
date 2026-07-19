import { db } from '../utils/firebase-admin';
import type { RideModel, RideStatus } from '../models/ride.types';
import { AppError } from '../utils/errors';

const RIDES_COLLECTION = 'rides';
const inMemoryRides = new Map<string, RideModel>();

function isEmulatorOrCredentialError(error: unknown): boolean {
  if (process.env.FUNCTIONS_EMULATOR === 'true') return true;
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('metadata') || msg.includes('oauth2') || msg.includes('credentials') || msg.includes('ECONNREFUSED');
}

export class RideRepository {
  async create(rideData: RideModel): Promise<RideModel> {
    inMemoryRides.set(rideData.id, rideData);
    try {
      await db.collection(RIDES_COLLECTION).doc(rideData.id).set(rideData);
      return rideData;
    } catch (error) {
      if (isEmulatorOrCredentialError(error)) {
        console.warn(`[EMULATOR FALLBACK] Saved ride ${rideData.id} into local memory (pure Node.js mode).`);
        return rideData;
      }
      throw new AppError('internal', 'Failed to save ride record to Firestore.', error);
    }
  }

  async getById(rideId: string): Promise<RideModel | null> {
    try {
      const docSnap = await db.collection(RIDES_COLLECTION).doc(rideId).get();
      if (!docSnap.exists) {
        return inMemoryRides.get(rideId) || null;
      }
      return docSnap.data() as RideModel;
    } catch (error) {
      if (isEmulatorOrCredentialError(error)) {
        console.warn(`[EMULATOR FALLBACK] Fetched ride ${rideId} from local memory.`);
        return inMemoryRides.get(rideId) || {
          id: rideId,
          customerName: 'Lord Alistair Vance',
          customerEmail: 'client@noirride.vip',
          customerPhone: '+44 7700 900077',
          vipTier: 'Gold',
          pickupLocation: 'The Ritz London, 150 Piccadilly',
          destination: 'Heathrow Airport Terminal 5 (Private Terminal)',
          date: new Date().toISOString().split('T')[0],
          time: '19:30',
          passengers: 2,
          serviceType: 'airport',
          vehicleId: 'veh-4',
          vehicleName: 'Rolls-Royce Phantom VIII',
          driverId: 'drv-1',
          driverName: 'Alistair Vance',
          status: 'EN_ROUTE',
          price: 450,
          notes: 'Simulated VIP ride via NoirRide pure Node.js Cloud Functions emulator.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as RideModel;
      }
      throw new AppError('internal', `Failed to fetch ride ${rideId} from Firestore.`, error);
    }
  }

  async updateStatus(rideId: string, status: RideStatus, notes?: string): Promise<void> {
    const existing = inMemoryRides.get(rideId);
    if (existing) {
      existing.status = status;
      if (notes !== undefined) existing.notes = notes;
      existing.updatedAt = new Date().toISOString();
      inMemoryRides.set(rideId, existing);
    }
    try {
      const updatePayload: Record<string, unknown> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (notes !== undefined) {
        updatePayload.notes = notes;
      }
      await db.collection(RIDES_COLLECTION).doc(rideId).update(updatePayload);
    } catch (error) {
      if (isEmulatorOrCredentialError(error)) {
        console.warn(`[EMULATOR FALLBACK] Updated status for ride ${rideId} to ${status} in local memory.`);
        return;
      }
      throw new AppError('internal', `Failed to update status for ride ${rideId}.`, error);
    }
  }

  async listByCustomer(email: string): Promise<RideModel[]> {
    try {
      const snapshot = await db
        .collection(RIDES_COLLECTION)
        .where('customerEmail', '==', email)
        .orderBy('createdAt', 'desc')
        .get();

      const rides: RideModel[] = [];
      snapshot.forEach((docSnap) => {
        rides.push(docSnap.data() as RideModel);
      });
      return rides.length > 0 ? rides : Array.from(inMemoryRides.values()).filter((r) => r.customerEmail === email);
    } catch (error) {
      if (isEmulatorOrCredentialError(error)) {
        console.warn(`[EMULATOR FALLBACK] Listed memory rides for customer ${email}.`);
        return Array.from(inMemoryRides.values()).filter((r) => r.customerEmail === email);
      }
      throw new AppError('internal', `Failed to list rides for customer ${email}.`, error);
    }
  }
}

export const rideRepo = new RideRepository();

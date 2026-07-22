import { getFirestore } from 'firebase-admin/firestore';
import { Location } from './types';
import { redis, SafeRedis } from './redis';
import { EventEmitter } from 'events';

export const fleetEvents = new EventEmitter();

export interface DriverState {
  id: string;
  name: string;
  location: Location;
  isAvailable: boolean;
  destination: Location | null; // Where they are currently heading (if busy)
  queuedRide: any | null; // Ride to pick up next
  currentRideId: string | null;
}



export class FleetManager {
  private static drivers = new Map<string, DriverState>();

  static async initialize() {
    console.log('[FleetManager] Loading fleet from Firestore...');
    this.drivers.clear();

    try {
      const db = getFirestore('noirride');
      const snapshot = await db.collection('drivers').get();
      
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          this.drivers.set(doc.id, {
            id: doc.id,
            name: data.name || doc.id,
            location: data.location || { lat: 44.4268, lng: 26.1025 }, // Fallback to Bucharest center
            isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
            destination: data.destination || null,
            queuedRide: null,
            currentRideId: null
          });
        });
      }
    } catch (err: any) {
      console.error('[FleetManager] Firestore load failed:', err.message);
    }

    console.log(`[FleetManager] Synchronized ${this.drivers.size} drivers into memory from Firestore:`, Array.from(this.drivers.values()).map(d => d.name));
    await this.syncToRedis();
  }

  static async syncToRedis() {
    try {
      const driversArr = Array.from(this.drivers.values());
      await SafeRedis.safeSet('fleet_state', JSON.stringify(driversArr));
    } catch (err) {
      console.error('[FleetManager] Failed to sync fleet to Redis:', err);
    }
  }

  static async getDriversFromRedis(): Promise<DriverState[]> {
    try {
      const data = await SafeRedis.safeGet('fleet_state');
      if (data) {
        return JSON.parse(data) as DriverState[];
      }
    } catch (err) {
      console.error('[FleetManager] Failed to get fleet from Redis:', err);
    }
    return Array.from(this.drivers.values());
  }

  static getDrivers(): DriverState[] {
    return Array.from(this.drivers.values());
  }

  static getDriver(id: string): DriverState | undefined {
    return this.drivers.get(id);
  }

  static updateDriverLocation(id: string, location: Location) {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.location = location;
      // Note: We avoid syncing location to Redis 60x/sec to prevent Upstash quota issues.
      // Location updates go through WebSocket. Redis only tracks the core state.
    }
  }

  static async setDriverBusy(id: string, destination: Location, rideId: string) {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.isAvailable = false;
      driver.destination = destination;
      driver.currentRideId = rideId;
      
      await this.syncToRedis();
      this.publishStatusChange(id, 'BUSY');
    }
  }

  static async setDriverAvailable(id: string) {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.isAvailable = true;
      driver.destination = null;
      driver.currentRideId = null;

      await this.syncToRedis();
      this.publishStatusChange(id, 'AVAILABLE');
    }
  }

  private static publishStatusChange(driverId: string, status: 'AVAILABLE' | 'BUSY') {
    fleetEvents.emit('status_change', { driverId, status });
    try {
      redis.publish('fleet_updates', JSON.stringify({
        type: 'STATUS_CHANGE',
        driverId,
        status
      }));
    } catch (err) {
      console.error('[FleetManager] Failed to publish status change to Redis:', err);
    }
  }

  static syncDriverStatus(id: string, status: 'AVAILABLE' | 'BUSY') {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.isAvailable = status === 'AVAILABLE';
      if (status === 'AVAILABLE') {
        driver.destination = null;
        driver.currentRideId = null;
      }
    }
  }

  static findBestDriver(pickupLocation: Location): DriverState | null {
    const drivers = this.getDrivers();
    if (drivers.length === 0) return null;

    const availableDrivers = drivers.filter(d => d.isAvailable);
    if (availableDrivers.length > 0) {
      return availableDrivers.sort((a, b) => this.calculateDistance(a.location, pickupLocation) - this.calculateDistance(b.location, pickupLocation))[0];
    }

    const busyDrivers = drivers.filter(d => !d.isAvailable && !d.queuedRide);
    if (busyDrivers.length > 0) {
      return busyDrivers.sort((a, b) => {
        const destA = a.destination || a.location;
        const destB = b.destination || b.location;
        return this.calculateDistance(destA, pickupLocation) - this.calculateDistance(destB, pickupLocation);
      })[0];
    }

    return null;
  }

  private static calculateDistance(loc1: Location, loc2: Location): number {
    const dx = loc1.lng - loc2.lng;
    const dy = loc1.lat - loc2.lat;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

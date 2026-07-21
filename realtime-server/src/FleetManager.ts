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

const DEFAULT_VIP_DRIVERS: Record<string, { id: string; name: string; location: Location }> = {
  'drv-1': { id: 'drv-1', name: 'Vin Diesel', location: { lat: 44.4268, lng: 26.1025 } },
  'drv-2': { id: 'drv-2', name: 'Jason Statham', location: { lat: 44.4411, lng: 26.0964 } },
  'drv-3': { id: 'drv-3', name: 'Jeremy Meeks', location: { lat: 44.4172, lng: 26.0664 } },
  'drv-4': { id: 'drv-4', name: 'Baroian Sergiu-Ioan', location: { lat: 44.4715, lng: 26.0822 } }
};

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
          const vipDef = DEFAULT_VIP_DRIVERS[data.id];
          if (vipDef) {
            this.drivers.set(vipDef.id, {
              id: vipDef.id,
              name: vipDef.name, // Force correct canonical name
              location: data.location || vipDef.location,
              isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
              destination: data.destination || null,
              queuedRide: null,
              currentRideId: null
            });
          }
        });
      }
    } catch (err: any) {
      console.warn('[FleetManager] Firestore load notice, applying default VIP fleet:', err.message);
    }

    // Ensure all 4 drivers are present
    Object.values(DEFAULT_VIP_DRIVERS).forEach(vip => {
      if (!this.drivers.has(vip.id)) {
        this.drivers.set(vip.id, {
          id: vip.id,
          name: vip.name,
          location: vip.location,
          isAvailable: true,
          destination: null,
          queuedRide: null,
          currentRideId: null
        });
      }
    });

    console.log(`[FleetManager] Synchronized ${this.drivers.size} canonical VIP drivers into memory:`, Array.from(this.drivers.values()).map(d => d.name));
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

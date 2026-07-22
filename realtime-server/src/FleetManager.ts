import { getDatabase } from 'firebase-admin/database';
import { Location } from './types';
import { SafeRTDB } from './rtdb';
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
    console.log('[FleetManager] Loading fleet from RTDB...');
    this.drivers.clear();

    try {
      if (SafeRTDB.isConnected()) {
        const db = getDatabase();
        const driversRef = db.ref('drivers');
        
        // Load initial state and keep listening for any changes
        driversRef.on('value', (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const activeIds = new Set<string>();
            Object.keys(data).forEach(id => {
              const d = data[id];
              activeIds.add(id);
              this.drivers.set(id, {
                id,
                name: d.name || id,
                location: d.location || { lat: 44.4268, lng: 26.1025 },
                isAvailable: d.isAvailable !== undefined ? d.isAvailable : true,
                destination: d.destination || null,
                queuedRide: d.queuedRide || null,
                currentRideId: d.currentRideId || null
              });
            });
            // Remove drivers that are no longer in RTDB
            for (const key of this.drivers.keys()) {
              if (!activeIds.has(key)) {
                this.drivers.delete(key);
              }
            }
          } else {
            this.drivers.clear();
          }
        }, (error) => {
          console.error('[FleetManager] RTDB listener error:', error);
        });

        console.log(`[FleetManager] Synchronized and listening to drivers from RTDB.`);
      }
    } catch (err: any) {
      console.error('[FleetManager] RTDB load failed:', err.message);
    }
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
      driver.location = location; // Optimistic update
      try {
        if (SafeRTDB.isConnected()) {
          const db = getDatabase();
          db.ref(`drivers/${id}/location`).set(location).catch(err => {
            console.error('[FleetManager] Error updating location in RTDB:', err);
          });
        }
      } catch (err) {}
    }
  }

  static async setDriverBusy(id: string, destination: Location, rideId: string) {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.isAvailable = false; // Optimistic update
      driver.destination = destination;
      driver.currentRideId = rideId;
      
      try {
        if (SafeRTDB.isConnected()) {
          const db = getDatabase();
          db.ref(`drivers/${id}`).update({
            isAvailable: false,
            destination,
            currentRideId: rideId,
            status: 'busy'
          }).catch(() => {});
        }
      } catch (err) {}

      this.publishStatusChange(id, 'BUSY');
    }
  }

  static async setDriverAvailable(id: string) {
    const driver = this.drivers.get(id);
    if (driver) {
      driver.isAvailable = true; // Optimistic update
      driver.destination = null;
      driver.currentRideId = null;

      try {
        if (SafeRTDB.isConnected()) {
          const db = getDatabase();
          db.ref(`drivers/${id}`).update({
            isAvailable: true,
            destination: null,
            currentRideId: null,
            status: 'available'
          }).catch(() => {});
        }
      } catch (err) {}

      this.publishStatusChange(id, 'AVAILABLE');
    }
  }

  private static publishStatusChange(driverId: string, status: 'AVAILABLE' | 'BUSY') {
    fleetEvents.emit('status_change', { driverId, status });
    try {
      if (SafeRTDB.isConnected()) {
        const db = getDatabase();
        db.ref('fleet_updates').push({
          type: 'STATUS_CHANGE',
          driverId,
          status,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('[FleetManager] Failed to publish status change to RTDB:', err);
    }
  }

  static syncDriverStatus(id: string, status: 'AVAILABLE' | 'BUSY') {
    // Left for backwards compatibility if needed, though RTDB listener handles state now.
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

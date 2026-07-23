import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { SafeRTDB } from './rtdb';
import { Location } from './types';
import { FleetManager } from './FleetManager';

const FLEET_UPDATES_MAX_AGE_MS = 60_000; // 60 seconds
const FLEET_UPDATES_CLEANUP_INTERVAL_MS = 30_000; // run cleanup every 30s

export class SimulationEngine {
  private static activeSimulations = new Map<string, SimulationEngine>();
  private static cleanupTimer: NodeJS.Timeout | null = null;

  /** Purge fleet_updates entries older than FLEET_UPDATES_MAX_AGE_MS */
  private static startCleanupLoop() {
    if (this.cleanupTimer) return; // already running
    this.cleanupTimer = setInterval(async () => {
      try {
        if (!SafeRTDB.isConnected()) return;
        const db = getDatabase();
        const cutoff = Date.now() - FLEET_UPDATES_MAX_AGE_MS;
        const oldEntries = await db.ref('fleet_updates')
          .orderByChild('timestamp')
          .endAt(cutoff)
          .once('value');
        if (oldEntries.exists()) {
          const updates: Record<string, null> = {};
          oldEntries.forEach((child) => {
            updates[child.key!] = null;
            return false; // continue iteration
          });
          await db.ref('fleet_updates').update(updates);
        }
      } catch (err) {
        // Cleanup is best-effort; don't crash the server
      }
    }, FLEET_UPDATES_CLEANUP_INTERVAL_MS);
  }

  public static startSimulation(driverId: string, rideId: string, rawGeometry: Location[], durationSec: number) {
    this.startCleanupLoop();
    this.stopSimulation(driverId);
    const sim = new SimulationEngine(driverId, rideId, rawGeometry, durationSec);
    this.activeSimulations.set(driverId, sim);
    sim.start();
  }

  public static stopSimulation(driverId: string) {
    if (this.activeSimulations.has(driverId)) {
      this.activeSimulations.get(driverId)?.stop();
      this.activeSimulations.delete(driverId);
    }
  }

  private rawGeometry: Location[];
  private durationSec: number;
  private startTime: number = 0;
  private timerId: NodeJS.Timeout | null = null;
  private segmentDistances: number[] = [];
  private totalDistance: number = 0;
  private driverId: string;
  private rideId: string;
  private isRunning: boolean = false;
  private lastFirestoreUpdate: number = 0;

  constructor(
    driverId: string,
    rideId: string,
    rawGeometry: Location[],
    durationSec: number
  ) {
    this.driverId = driverId;
    this.rideId = rideId;
    this.rawGeometry = rawGeometry;
    this.durationSec = durationSec || 300; // default 5 mins if not provided
    this.calculateDistances();
  }

  private calculateDistances() {
    this.segmentDistances = [0];
    this.totalDistance = 0;
    if (this.rawGeometry.length === 0) return;

    for (let i = 1; i < this.rawGeometry.length; i++) {
      const d = this.haversineDistance(this.rawGeometry[i - 1], this.rawGeometry[i]);
      this.totalDistance += d;
      this.segmentDistances.push(this.totalDistance);
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private tick = () => {
    if (!this.isRunning) return;
    
    const now = Date.now();
    const elapsedSec = (now - this.startTime) / 1000;
    
    // Calculate how far along the path we should be
    let progress = Math.min(elapsedSec / this.durationSec, 1.0);
    
    if (progress >= 1.0) {
       progress = 1.0;
       this.isRunning = false; // reached end
    }

    if (this.rawGeometry.length === 0) {
      return;
    }

    let currentPosition = this.rawGeometry[0];
    let remainingPolyline = this.rawGeometry;

    if (this.rawGeometry.length > 1) {
      const targetDistance = progress * this.totalDistance;

      // Find current segment
      let currentSegment = 0;
      while (currentSegment < this.rawGeometry.length - 2 && this.segmentDistances[currentSegment + 1] < targetDistance) {
        currentSegment++;
      }

      const d1 = this.segmentDistances[currentSegment];
      const d2 = this.segmentDistances[currentSegment + 1];
      const p1 = this.rawGeometry[currentSegment];
      const p2 = this.rawGeometry[currentSegment + 1];

      remainingPolyline = this.rawGeometry.slice(currentSegment + 1);

      if (d1 !== undefined && d2 !== undefined && p1 && p2) {
        const fraction = d2 === d1 ? 0 : (targetDistance - d1) / (d2 - d1);
        currentPosition = {
          lat: p1.lat + (p2.lat - p1.lat) * fraction,
          lng: p1.lng + (p2.lng - p1.lng) * fraction
        };
        
        remainingPolyline = [currentPosition, ...remainingPolyline];
      }
    }

    const currentEta = Math.max(0, Math.floor(this.durationSec - elapsedSec));

    this.publishUpdate(currentPosition, remainingPolyline, currentEta);

    if (this.isRunning) {
      // 1-second update rate to conserve RTDB bandwidth
      this.timerId = setTimeout(this.tick, 1000);
    }
  }

  private publishUpdate(location: Location, remainingPolyline: Location[], currentEta: number) {
    try {
      // Update in-memory state so subsequent lookups (and eventual Redis syncs) are accurate
      FleetManager.updateDriverLocation(this.driverId, location);

      const now = Date.now();
      if (now - this.lastFirestoreUpdate >= 5000) {
        this.lastFirestoreUpdate = now;
        try {
          const dbFs = getFirestore('noirride');
          dbFs.collection('rides').doc(this.rideId).update({ currentEta })
            .catch(err => console.warn('[SimulationEngine] Error updating ETA in Firestore:', err.message));
        } catch (err: any) {
           console.warn('[SimulationEngine] Error getting Firestore:', err.message);
        }
      }

      if (SafeRTDB.isConnected()) {
        const db = getDatabase();
        // Fire and forget, don't await to avoid blocking tick loop
        db.ref('fleet_updates').push({
          type: 'LOCATION_UPDATE',
          driverId: this.driverId,
          location,
          rawGeometry: remainingPolyline,
          timestamp: Date.now()
        }).catch(err => console.error('[SimulationEngine] RTDB push error', err));
      }
    } catch (err) {
      console.error('[SimulationEngine] Failed to publish location to RTDB:', err);
    }
  }

  // Haversine distance in meters
  private haversineDistance(p1: Location, p2: Location) {
    const R = 6371e3; 
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

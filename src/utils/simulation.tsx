export interface Location {
  lat: number;
  lng: number;
}

export interface SimulationUpdateData {
  currentPosition: Location;
  bearing: number;
  remainingPolyline: Location[];
}

export class SimulationEngine {
  private rawGeometry: Location[];
  private durationSec: number;
  private startTime: number = 0;
  private timerId: number | null = null;
  private segmentDistances: number[] = [];
  private totalDistance: number = 0;
  private onUpdate: (data: SimulationUpdateData) => void;
  private isRunning: boolean = false;

  constructor(
    rawGeometry: Location[],
    durationSec: number,
    onUpdate: (data: SimulationUpdateData) => void
  ) {
    this.rawGeometry = rawGeometry;
    this.durationSec = durationSec || 300; // default 5 mins if not provided
    this.onUpdate = onUpdate;
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
    this.startTime = performance.now();
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      cancelAnimationFrame(this.timerId);
      this.timerId = null;
    }
  }

  private tick = () => {
    if (!this.isRunning) return;
    
    const now = performance.now();
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

    if (this.rawGeometry.length === 1) {
      this.onUpdate({
        currentPosition: this.rawGeometry[0],
        bearing: 0,
        remainingPolyline: this.rawGeometry
      });
      return;
    }

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

    let currentPosition = p1;
    let bearing = 0;
    let remainingPolyline = this.rawGeometry.slice(currentSegment + 1);

    if (d1 !== undefined && d2 !== undefined && p1 && p2) {
      const fraction = d2 === d1 ? 0 : (targetDistance - d1) / (d2 - d1);
      currentPosition = {
        lat: p1.lat + (p2.lat - p1.lat) * fraction,
        lng: p1.lng + (p2.lng - p1.lng) * fraction
      };

      bearing = this.calculateBearing(p1, p2);
      
      // The remaining polyline should start from the interpolated current position
      remainingPolyline = [currentPosition, ...remainingPolyline];
    }

    this.onUpdate({ currentPosition, bearing, remainingPolyline });

    if (this.isRunning) {
      // 60fps update rate for ultra-smooth animation
      this.timerId = requestAnimationFrame(this.tick);
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

  private calculateBearing(p1: Location, p2: Location) {
    const dy = p2.lat - p1.lat;
    const dx = p2.lng - p1.lng;
    let bearing = Math.atan2(dx, dy) * 180 / Math.PI;
    if (bearing < 0) bearing += 360;
    return bearing;
  }
}

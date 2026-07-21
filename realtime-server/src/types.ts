export interface Location {
  lng: number;
  lat: number;
}

export type DriverStatus = 'free' | 'dispatch' | 'in_trip';
export type RideStatus = 'searching_driver' | 'driver_en_route' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled';

export interface Driver {
  id: string;
  currentLocation: Location;
  status: DriverStatus;
  vehicleType: string;
}

export interface Ride {
  id: string;
  customerId: string;
  driverId?: string;
  pickup: Location;
  destination: Location;
  status: RideStatus;
  routeGeometry?: Location[];
  etaSeconds?: number;
}

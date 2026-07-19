export type RideStatus = 'SCHEDULED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServiceType = 'airport' | 'hourly' | 'intercity';

export interface VehicleModel {
  id: string;
  name: string;
  category: string;
  tagline: string;
  passengers: number;
  luggage: number;
  basePrice: number;
  ratePerHour: number;
  image: string;
  features: string[];
  isAvailable: boolean;
}

export interface DriverModel {
  id: string;
  name: string;
  rating: number;
  completedRides: number;
  clearanceLevel: string;
  phone: string;
  isAvailable: boolean;
}

export interface RideModel {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vipTier: 'Gold' | 'Platinum' | 'Black Diamond';
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  serviceType: ServiceType;
  vehicleId: string;
  vehicleName: string;
  driverId?: string;
  driverName?: string;
  status: RideStatus;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = 'airport' | 'hourly' | 'intercity';

export type RideStatus = 'SCHEDULED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Vehicle {
  id: string;
  name: string;
  category: 'Business Sedan' | 'Premium SUV' | 'Luxury Van' | 'Executive Class' | 'Custom Street & VIP' | string;
  tagline: string;
  description: string;
  image: string;
  fallbackSvg: string;
  passengerCapacity: number;
  luggageCapacity: number;
  basePrice: number;
  ratePerKm: number;
  ratePerHour: number;
  features: string[];
  makeModel: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  completedRides: number;
  phone: string;
  photo: string;
  languages: string[];
  vehicleMake: string;
  licensePlate: string;
}

export interface Ride {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vipTier?: 'Standard' | 'Silver' | 'Gold' | 'Black Card';
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  serviceType: ServiceType;
  vehicleId: string;
  vehicleName: string;
  driverId: string;
  driverName: string;
  status: RideStatus;
  price: number;
  notes?: string;
  createdAt: string;
}

export interface BookingFormState {
  pickupLocation: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  serviceType: ServiceType;
  selectedVehicleId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  specialRequests?: string;
}

export type UserRole = 'client' | 'driver' | 'dispatcher' | 'admin';

export type Permission =
  | 'bookings:create'
  | 'bookings:read'
  | 'bookings:cancel'
  | 'bookings:update_status'
  | 'users:read'
  | 'users:manage'
  | 'fleet:manage'
  | 'system:admin';


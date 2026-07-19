import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ride, BookingFormState, RideStatus, Vehicle, Driver } from '../types';
import { initialMockRides } from '../data/rides';
import { mockVehicles } from '../data/vehicles';
import { mockDrivers } from '../data/drivers';

import { api } from '../services/api';

interface RideContextType {
  rides: Ride[];
  vehicles: Vehicle[];
  drivers: Driver[];
  activeBooking: BookingFormState;
  confirmedRide: Ride | null;
  updateBookingField: <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => void;
  selectVehicle: (vehicleId: string) => void;
  calculatePrice: (vehicleId?: string) => { base: number; serviceFee: number; tax: number; total: number };
  confirmBooking: (customerDetails: { name: string; email: string; phone: string; specialRequests?: string }) => Promise<Ride>;
  cancelConfirmedRide: () => void;
  updateRideStatus: (rideId: string, status: RideStatus, notes?: string) => void;
  resetBooking: () => void;
}

const defaultBookingState: BookingFormState = {
  pickupLocation: 'Four Seasons Downtown, 27 Barclay St, NYC',
  destination: 'JFK International Airport (Terminal 4 Private Aviation)',
  date: new Date().toISOString().split('T')[0],
  time: '19:30',
  passengers: 2,
  serviceType: 'airport',
  selectedVehicleId: 'veh-4',
};

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles] = useState<Vehicle[]>(mockVehicles);
  const [drivers] = useState<Driver[]>(mockDrivers);
  const [rides, setRides] = useState<Ride[]>(() => {
    const saved = localStorage.getItem('noir_rides_data');
    return saved ? JSON.parse(saved) : initialMockRides;
  });

  const [activeBooking, setActiveBooking] = useState<BookingFormState>(() => {
    const saved = localStorage.getItem('noir_active_booking');
    return saved ? JSON.parse(saved) : defaultBookingState;
  });

  const [confirmedRide, setConfirmedRide] = useState<Ride | null>(() => {
    const saved = localStorage.getItem('noir_confirmed_ride');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('noir_rides_data', JSON.stringify(rides));
  }, [rides]);

  useEffect(() => {
    localStorage.setItem('noir_active_booking', JSON.stringify(activeBooking));
  }, [activeBooking]);

  useEffect(() => {
    if (confirmedRide) {
      localStorage.setItem('noir_confirmed_ride', JSON.stringify(confirmedRide));
    } else {
      localStorage.removeItem('noir_confirmed_ride');
    }
  }, [confirmedRide]);

  const updateBookingField = <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => {
    setActiveBooking((prev) => ({ ...prev, [field]: value }));
  };

  const selectVehicle = (vehicleId: string) => {
    setActiveBooking((prev) => ({ ...prev, selectedVehicleId: vehicleId }));
  };

  const calculatePrice = (vehicleId?: string) => {
    const targetId = vehicleId || activeBooking.selectedVehicleId || 'veh-1';
    const vehicle = vehicles.find((v) => v.id === targetId) || vehicles[0];

    let base = vehicle.basePrice;
    if (activeBooking.serviceType === 'hourly') {
      base = vehicle.ratePerHour * 4; // Mock 4 hours minimum
    } else if (activeBooking.serviceType === 'intercity') {
      base = vehicle.basePrice * 2.8;
    }

    const serviceFee = Math.round(base * 0.12);
    const tax = Math.round((base + serviceFee) * 0.0887);
    const total = base + serviceFee + tax;

    return { base, serviceFee, tax, total };
  };

  const confirmBooking = async (customerDetails: { name: string; email: string; phone: string; specialRequests?: string }): Promise<Ride> => {
    const vehicle = vehicles.find((v) => v.id === activeBooking.selectedVehicleId) || vehicles[0];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const priceBreakdown = calculatePrice(vehicle.id);

    try {
      const backendRide = await api.createBooking({
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        pickupLocation: activeBooking.pickupLocation,
        destination: activeBooking.destination,
        date: activeBooking.date,
        time: activeBooking.time,
        passengers: activeBooking.passengers,
        serviceType: activeBooking.serviceType,
        vehicleId: vehicle.id,
        specialRequests: customerDetails.specialRequests,
      });

      setRides((prev) => [backendRide, ...prev]);
      setConfirmedRide(backendRide);
      return backendRide;
    } catch (err) {
      console.warn('[NOIRRIDE PROTOCOL] Backend Cloud Function unavailable or emulator offline. Using local VIP fallback:', err);
      // Fallback local creation so UI remains functional
      const newRideId = `NR-${Math.floor(1000 + Math.random() * 9000)}`;
      const fallbackRide: Ride = {
        id: newRideId,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        vipTier: 'Gold',
        pickupLocation: activeBooking.pickupLocation,
        destination: activeBooking.destination,
        date: activeBooking.date,
        time: activeBooking.time,
        passengers: activeBooking.passengers,
        serviceType: activeBooking.serviceType,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        driverId: driver.id,
        driverName: driver.name,
        status: 'EN_ROUTE',
        price: priceBreakdown.total,
        notes: customerDetails.specialRequests || 'Customer booked via NoirRide iOS/Web portal.',
        createdAt: new Date().toISOString(),
      };

      setRides((prev) => [fallbackRide, ...prev]);
      setConfirmedRide(fallbackRide);
      return fallbackRide;
    }
  };

  const cancelConfirmedRide = async () => {
    if (!confirmedRide) return;
    try {
      await api.cancelBooking(confirmedRide.id, 'Cancelled via VIP app interface');
    } catch (err) {
      console.warn('[NOIRRIDE PROTOCOL] Could not reach backend cancel endpoint, updating locally:', err);
    }
    updateRideStatus(confirmedRide.id, 'CANCELLED', 'Cancelled by customer via app interface');
    setConfirmedRide((prev) => prev ? { ...prev, status: 'CANCELLED' } : null);
  };

  const updateRideStatus = async (rideId: string, status: RideStatus, notes?: string) => {
    try {
      await api.updateRideStatus(rideId, status, notes);
    } catch (err) {
      console.warn('[NOIRRIDE PROTOCOL] Could not reach backend status update endpoint, syncing locally:', err);
    }

    setRides((prev) =>
      prev.map((ride) => {
        if (ride.id === rideId) {
          return {
            ...ride,
            status,
            notes: notes !== undefined ? notes : ride.notes,
          };
        }
        return ride;
      })
    );

    if (confirmedRide && confirmedRide.id === rideId) {
      setConfirmedRide((prev) => (prev ? { ...prev, status, notes: notes !== undefined ? notes : prev.notes } : null));
    }
  };

  const resetBooking = () => {
    setActiveBooking(defaultBookingState);
    setConfirmedRide(null);
  };

  return (
    <RideContext.Provider
      value={{
        rides,
        vehicles,
        drivers,
        activeBooking,
        confirmedRide,
        updateBookingField,
        selectVehicle,
        calculatePrice,
        confirmBooking,
        cancelConfirmedRide,
        updateRideStatus,
        resetBooking,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRideContext = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRideContext must be used within a RideProvider');
  }
  return context;
};

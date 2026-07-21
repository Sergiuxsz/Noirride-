import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ride, BookingFormState, RideStatus, Vehicle, Driver } from '../types';
import { api } from '../services/api';

import vindieselPhoto from '../assets/vindiesel.png';
import stathamPhoto from '../assets/statham.png';
import meeksPhoto from '../assets/meeks.jpg';
import sergiuPhoto from '../assets/sergiu.png';

import phantomImg from '../assets/fleet/phantom.png';
import maybachImg from '../assets/fleet/maybach.png';
import escaladeImg from '../assets/fleet/escalade.png';
import vclassImg from '../assets/fleet/vclass.png';
import bmw7Img from '../assets/fleet/bmw7.png';
import mulsanneImg from '../assets/fleet/mulsanne.png';

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    id: 'veh-4',
    name: 'Rolls-Royce Phantom VIII',
    category: 'Executive Class',
    tagline: 'Flagship Executive Luxury',
    description: 'The pinnacle of bespoke luxury engineering, featuring star-roof lighting, extended legroom, acoustic serenity, and armored composite chassis.',
    image: phantomImg,
    fallbackSvg: '',
    passengerCapacity: 3,
    luggageCapacity: 3,
    basePrice: 450,
    ratePerKm: 12,
    ratePerHour: 350,
    features: ['Armored Body', 'Champagne Bar', 'Starlight Headliner', 'Encrypted 5G'],
    makeModel: 'Rolls-Royce Phantom VIII'
  },
  {
    id: 'veh-1',
    name: 'Mercedes-Benz S-Class (Maybach Executive)',
    category: 'Executive Class',
    tagline: 'Precision German Chauffeur Suite',
    description: 'First-class recline seating with calf rests, massagers, active ambient lighting, and Burmester high-end 4D surround acoustics.',
    image: maybachImg,
    fallbackSvg: '',
    passengerCapacity: 3,
    luggageCapacity: 3,
    basePrice: 220,
    ratePerKm: 6.5,
    ratePerHour: 180,
    features: ['Executive Rear Seating', 'Burmester 4D Audio', 'Massage Seating'],
    makeModel: 'Mercedes-Maybach S-Class'
  },
  {
    id: 'veh-2',
    name: 'Cadillac Escalade ESV (Armored B6)',
    category: 'Armored SUV',
    tagline: 'Fortified Executive Protection',
    description: 'Full B6 armor level protection with run-flat tires, satellite communications, dual privacy screens, and high-clearance command stance.',
    image: escaladeImg,
    fallbackSvg: '',
    passengerCapacity: 6,
    luggageCapacity: 6,
    basePrice: 650,
    ratePerKm: 18,
    ratePerHour: 500,
    features: ['Ballistic B6 Armor', 'Run-Flat Tires', 'Encrypted Satellite Comms'],
    makeModel: 'Cadillac Escalade ESV'
  },
  {
    id: 'veh-3',
    name: 'Mercedes-Benz V-Class VIP Lounge',
    category: 'Luxury Van',
    tagline: 'Moving Boardroom & Mobile Office',
    description: 'Face-to-face luxury seat positioning, retractor conference tables, dedicated Wi-Fi 6 router, and coffee bar for delegation transfers.',
    image: vclassImg,
    fallbackSvg: '',
    passengerCapacity: 7,
    luggageCapacity: 8,
    basePrice: 300,
    ratePerKm: 8,
    ratePerHour: 220,
    features: ['Conferencing Seating', 'Wi-Fi & Apple TV', 'Mini-Bar & Espresso'],
    makeModel: 'Mercedes-Benz V-Class'
  },
  {
    id: 'veh-5',
    name: 'BMW 7 Series Protection (i7 Armored VR9)',
    category: 'Armored Electric',
    tagline: 'Discreet Electric VR9 Ballistic Shield',
    description: 'Zero-emission electric luxury sedan equipped with VR9 certified armor, fresh air emergency system, and theater screen back seat.',
    image: bmw7Img,
    fallbackSvg: '',
    passengerCapacity: 3,
    luggageCapacity: 3,
    basePrice: 750,
    ratePerKm: 20,
    ratePerHour: 580,
    features: ['VR9 Ballistic Protection', 'Underbody Shield', 'Fresh Air Supply System'],
    makeModel: 'BMW i7 Protection'
  },
  {
    id: 'veh-6',
    name: 'Bentley Mulsanne Extended Wheelbase',
    category: 'Executive Class',
    tagline: 'Bespoke British Craftsmanship',
    description: 'Extended wheelbase luxury with handcrafted leather upholstery, solid wood accents, folding picnic tables, and whisper-quiet V8 drive.',
    image: mulsanneImg,
    fallbackSvg: '',
    passengerCapacity: 3,
    luggageCapacity: 3,
    basePrice: 380,
    ratePerKm: 10,
    ratePerHour: 300,
    features: ['Airline-Style Reclining Seats', 'Picnic Tables', 'Naim Audio'],
    makeModel: 'Bentley Mulsanne EWB'
  }
];

export const DEFAULT_DRIVERS: Driver[] = [
  {
    id: 'drv-1',
    name: 'Vin Diesel',
    rating: 5.0,
    completedRides: 1970,
    phone: '+1 (555) 019-2470',
    photo: vindieselPhoto,
    languages: ['EN', 'ES'],
    vehicleMake: 'Dodge Charger SRT / Maybach',
    licensePlate: 'FAST-001',
    status: 'AVAILABLE',
    tagline: "I've got nothin' but time."
  },
  {
    id: 'drv-2',
    name: 'Jason Statham',
    rating: 4.99,
    completedRides: 2450,
    phone: '+44 7700 900099',
    photo: stathamPhoto,
    languages: ['EN', 'FR'],
    vehicleMake: 'Audi A8 L W12 Security',
    licensePlate: 'TRANSPORTER',
    status: 'AVAILABLE',
    tagline: 'The Transporter — Precision, Speed & Discretion'
  },
  {
    id: 'drv-3',
    name: 'Jeremy Meeks',
    rating: 4.95,
    completedRides: 860,
    phone: '+1 (555) 018-9922',
    photo: meeksPhoto,
    languages: ['EN', 'IT'],
    vehicleMake: 'Rolls-Royce Phantom VIII',
    licensePlate: 'HOT-MODEL',
    status: 'AVAILABLE',
    tagline: 'High-Fashion Executive Protection Escort'
  },
  {
    id: 'drv-4',
    name: 'Baroian Sergiu-Ioan',
    rating: 5.0,
    completedRides: 9999,
    phone: '+40 722 000 777',
    photo: sergiuPhoto,
    languages: ['EN', 'RO', 'DE'],
    vehicleMake: 'Armored Executive Custom',
    licensePlate: 'SERGIU-VIP',
    status: 'AVAILABLE',
    tagline: 'Average engine lifetime of 5 minutes , but vip styling tho '
  }
];

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
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [rides, setRides] = useState<Ride[]>(() => {
    const saved = localStorage.getItem('noir_rides_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [remotePrices, setRemotePrices] = useState<Record<string, { base: number; serviceFee: number; tax: number; total: number }>>({});

  const [activeBooking, setActiveBooking] = useState<BookingFormState>(() => {
    const saved = localStorage.getItem('noir_active_booking');
    return saved ? JSON.parse(saved) : defaultBookingState;
  });

  const [confirmedRide, setConfirmedRide] = useState<Ride | null>(() => {
    const saved = localStorage.getItem('noir_confirmed_ride');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Sanitize driver name if legacy
      const matched = DEFAULT_DRIVERS.find((d) => d.id === parsed.driverId || d.name === parsed.driverName);
      if (matched) {
        parsed.driverName = matched.name;
        parsed.driverId = matched.id;
      } else {
        parsed.driverName = DEFAULT_DRIVERS[0].name;
        parsed.driverId = DEFAULT_DRIVERS[0].id;
      }
      return parsed;
    } catch {
      return null;
    }
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

  // Sync Redis remote distance fare calculations
  useEffect(() => {
    const syncRedisPrices = async () => {
      if (!vehicles || vehicles.length === 0) return;
      try {
        const promises = vehicles.map(async (v) => {
          try {
            const res = await api.calculatePriceRemote({
              vehicleId: v.id,
              serviceType: activeBooking.serviceType,
              distanceMeters: activeBooking.distanceMeters,
              durationSeconds: activeBooking.durationSeconds,
            });
            return { id: v.id, price: { base: res.baseFare, serviceFee: res.serviceFee, tax: res.tax, total: res.total } };
          } catch (err) {
            return null;
          }
        });
        const results = await Promise.all(promises);
        const map: Record<string, { base: number; serviceFee: number; tax: number; total: number }> = {};
        results.forEach((r) => {
          if (r) map[r.id] = r.price;
        });
        if (Object.keys(map).length > 0) {
          setRemotePrices(map);
        }
      } catch (err) {
        console.warn('[NOIRRIDE PROTOCOL] Redis remote price prefetch skipped:', err);
      }
    };

    syncRedisPrices();
  }, [vehicles, activeBooking.serviceType, activeBooking.distanceMeters, activeBooking.durationSeconds]);

  // Sync live fleet status from Realtime Server and WebSocket
  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const liveFleet = await api.getFleetStatus();
        if (liveFleet && liveFleet.length > 0) {
          setDrivers(() => {
            return DEFAULT_DRIVERS.map((defaultDriver) => {
              const live = liveFleet.find((l: any) => l.id === defaultDriver.id);
              if (live) {
                return {
                  ...defaultDriver,
                  status: live.isAvailable ? 'AVAILABLE' : 'BUSY'
                };
              }
              return defaultDriver;
            });
          });
        }

        const activeRides = await api.getActiveRides();
        if (activeRides && activeRides.length > 0) {
          setRides((prev) => {
            const newRides = [...prev];
            activeRides.forEach((activeRide: any) => {
              const existingIdx = newRides.findIndex(r => r.id === activeRide.rideId);
              if (existingIdx >= 0) {
                newRides[existingIdx] = {
                  ...newRides[existingIdx],
                  status: activeRide.status,
                };
              } else {
                newRides.push({
                  id: activeRide.rideId,
                  customerName: 'VIP Client (Active Telemetry)',
                  customerEmail: '',
                  customerPhone: '',
                  vipTier: 'Black Card',
                  pickupLocation: 'Telemetry Checkpoint',
                  destination: 'Telemetry Destination',
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                  passengers: 1,
                  serviceType: 'private-chauffeur',
                  vehicleId: 'veh-1',
                  vehicleName: 'VIP Unit',
                  driverId: activeRide.driverId,
                  driverName: DEFAULT_DRIVERS.find(d => d.id === activeRide.driverId)?.name || activeRide.driverId,
                  status: activeRide.status,
                  price: 0,
                  createdAt: new Date().toISOString(),
                });
              }
            });
            return newRides;
          });
        }
      } catch (err) {
        console.warn('[NOIRRIDE PROTOCOL] Could not sync initial fleet/rides status', err);
      }
    };

    fetchFleet();

    // Setup global WebSocket connection for real-time status sync
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | undefined;

    const connectWs = () => {
      const serverUrl = import.meta.env.VITE_REALTIME_SERVER_WS_URL || 'ws://localhost:8080/ws/fleet';
      ws = new WebSocket(serverUrl);

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.type === 'STATUS_CHANGE') {
            const isBusy = parsed.status === 'BUSY' || parsed.status === 'busy';
            setDrivers(prevDrivers => 
              prevDrivers.map(d => 
                d.id === parsed.driverId 
                  ? { ...d, status: isBusy ? 'BUSY' : 'AVAILABLE' } 
                  : d
              )
            );

            // Deselect driver if they become busy
            setActiveBooking((prev) => {
              if (prev.selectedDriverId === parsed.driverId && isBusy) {
                return { ...prev, selectedDriverId: undefined };
              }
              return prev;
            });
          } 
          else if (parsed.type === 'RIDE_STATUS_CHANGE') {
            setRides((prev) => {
              const newRides = [...prev];
              const existingIdx = newRides.findIndex(r => r.id === parsed.rideId);
              if (existingIdx >= 0) {
                newRides[existingIdx] = { ...newRides[existingIdx], status: parsed.status };
              }
              return newRides;
            });
            setConfirmedRide((prev) => (prev && prev.id === parsed.rideId ? { ...prev, status: parsed.status } : prev));
          } 
          else if (parsed.type === 'RIDE_COMPLETED') {
            setRides((prev) => {
              const newRides = [...prev];
              const existingIdx = newRides.findIndex(r => r.id === parsed.rideId);
              if (existingIdx >= 0) {
                newRides[existingIdx] = { ...newRides[existingIdx], status: 'COMPLETED' };
              }
              return newRides;
            });
            setConfirmedRide((prev) => (prev && prev.id === parsed.rideId ? { ...prev, status: 'COMPLETED' } : prev));
            
            // Re-mark driver available after ride completion
            setDrivers(prevDrivers => 
              prevDrivers.map(d => 
                d.id === parsed.driverId ? { ...d, status: 'AVAILABLE' } : d
              )
            );
          }
        } catch (e) {
          console.warn('[NOIRRIDE PROTOCOL] WebSocket parse error in RideContext:', e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = window.setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Fetch Vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await api.getVehicles();
        if (data && data.length > 0) {
          const updated = data.map((v: Vehicle) => {
            const def = DEFAULT_VEHICLES.find((d) => d.id === v.id);
            return {
              ...v,
              image: def?.image || v.image || phantomImg,
              category: v.category || def?.category || 'Executive Class',
              makeModel: v.makeModel || def?.makeModel || v.name,
            };
          });
          setVehicles(updated);
        }
      } catch (err) {
        console.warn('[NOIRRIDE PROTOCOL] Could not fetch vehicles', err);
      }
    };
    fetchVehicles();
  }, []);

  const updateBookingField = <K extends keyof BookingFormState>(field: K, value: BookingFormState[K]) => {
    setActiveBooking((prev) => ({ ...prev, [field]: value }));
  };

  const selectVehicle = (vehicleId: string) => {
    setActiveBooking((prev) => ({ ...prev, selectedVehicleId: vehicleId }));
  };

  const calculatePrice = (vehicleId?: string) => {
    const targetId = vehicleId || activeBooking.selectedVehicleId || 'veh-1';
    if (remotePrices[targetId]) {
      return remotePrices[targetId];
    }

    const vehicle = vehicles.find((v) => v.id === targetId) || vehicles[0];
    let base = vehicle ? vehicle.basePrice : 220;
    
    const distanceKm = (activeBooking.distanceMeters || 0) / 1000;
    const durationHours = (activeBooking.durationSeconds || 0) / 3600;

    if (activeBooking.serviceType === 'hourly') {
      const billableHours = Math.max(4, durationHours);
      base = (vehicle?.ratePerHour || 180) * billableHours; 
    } else {
      if (activeBooking.distanceMeters && vehicle) {
         const distanceCost = distanceKm * vehicle.ratePerKm;
         base = Math.max(vehicle.basePrice, vehicle.basePrice + distanceCost);
      } else if (activeBooking.serviceType === 'intercity' && vehicle) {
         base = vehicle.basePrice * 2.8;
      }
    }

    const serviceFee = Math.round(base * 0.12);
    const tax = Math.round((base + serviceFee) * 0.0887);
    const total = Math.round(base + serviceFee + tax);

    return { base, serviceFee, tax, total };
  };

  const confirmBooking = async (customerDetails: { name: string; email: string; phone: string; specialRequests?: string }): Promise<Ride> => {
    const vehicle = vehicles.find((v) => v.id === activeBooking.selectedVehicleId) || vehicles[0];
    const driver = drivers.find((d) => d.id === activeBooking.selectedDriverId) || drivers.find((d) => d.status === 'AVAILABLE') || drivers[0];
    
    if (!vehicle || !driver) {
      throw new Error("Vehicle or Driver not selected.");
    }
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
        driverId: activeBooking.selectedDriverId,
        driverName: driver.name,
        specialRequests: customerDetails.specialRequests,
      });

      setRides((prev) => [backendRide, ...prev]);
      setConfirmedRide(backendRide);
      
      // Removed redundant api.startRideSimulation from the frontend.
      // The Cloud Function backend automatically triggers it via webhook,
      // and we avoid the race condition that corrupted the simulation state.
      return backendRide;
    } catch (err) {
      console.error('[NOIRRIDE PROTOCOL] Booking failed:', err);
      throw err;
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

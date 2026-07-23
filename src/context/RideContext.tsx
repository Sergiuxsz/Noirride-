import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Ride, BookingFormState, RideStatus, Vehicle, Driver } from '../types';
import { db, rtdb } from '../lib/firebase';
import { api } from '../services/api';
import { collection, onSnapshot, query as firestoreQuery, where, documentId } from 'firebase/firestore';
import { ref, onChildAdded, query as rtdbQuery, startAt, orderByChild, get, set } from 'firebase/database';
import { useAuth } from './AuthContext';

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
  isRehydratingDraft: boolean;
}

const defaultBookingState: BookingFormState = {
  pickupLocation: '',
  destination: '',
  date: new Date().toISOString().split('T')[0],
  time: '19:30',
  passengers: 2,
  serviceType: 'airport',
  selectedVehicleId: 'veh-4',
};

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const userId = auth?.user?.uid || 'guest';
  const isAdmin = auth?.isAdmin;

  const getStorageKey = (base: string) => `${base}_${userId}`;

  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(DEFAULT_DRIVERS);
  const [remotePrices, setRemotePrices] = useState<Record<string, { base: number; serviceFee: number; tax: number; total: number }>>({});

  const [rides, setRides] = useState<Ride[]>(() => {
    const saved = localStorage.getItem(getStorageKey('noir_rides_cache'));
    return saved ? JSON.parse(saved) : [];
  });
  const [activeBooking, setActiveBooking] = useState<BookingFormState>(defaultBookingState);
  const [confirmedRide, setConfirmedRide] = useState<Ride | null>(() => {
    const saved = localStorage.getItem(getStorageKey('noir_rides_cache'));
    if (!saved) return null;
    try {
      const parsedRides = JSON.parse(saved);
      const active = parsedRides.find((r: Ride) => 
        (isAdmin ? r.userId === userId : true) && 
        ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)
      );
      return active || null;
    } catch {
      return null;
    }
  });
  const [persistedRideId, setPersistedRideId] = useState<string | null>(() => localStorage.getItem(getStorageKey('noir_active_ride_id')));

  const [draftBookingId, setDraftBookingId] = useState<string | null>(null);
  const [isRehydratingDraft, setIsRehydratingDraft] = useState(true);

  // Sync state when userId changes
  useEffect(() => {
    const ridesStr = localStorage.getItem(getStorageKey('noir_rides_cache'));
    const initialRides = ridesStr ? JSON.parse(ridesStr) : [];
    setRides(initialRides);

    if (initialRides.length > 0) {
      const active = initialRides.find((r: Ride) => 
        (isAdmin ? r.userId === userId : true) && 
        ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)
      );
      setConfirmedRide(active || null);
    } else {
      setConfirmedRide(null);
    }

    // Clear old format keys
    localStorage.removeItem('noir_rides_data');
    localStorage.removeItem('noir_confirmed_ride');

    const initializeDraftBooking = async () => {
      setIsRehydratingDraft(true);
      const cachedId = localStorage.getItem(getStorageKey('noir_draft_booking_id'));
      if (cachedId) {
        try {
          const snapshot = await get(ref(rtdb, `draft_bookings/${cachedId}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            const now = Date.now();
            const age = now - (data.updatedAt || 0);
            
            // Validate: expires after 12 hours (43200000 ms)
            if (age < 43200000 && data.state) {
              console.log('[NOIRRIDE PROTOCOL] Restored draft booking from RTDB:', cachedId);
              setActiveBooking(data.state);
              setDraftBookingId(cachedId);
              setIsRehydratingDraft(false);
              return;
            } else {
              console.warn('[NOIRRIDE PROTOCOL] Draft booking expired or invalid, cleaning up.');
              await set(ref(rtdb, `draft_bookings/${cachedId}`), null);
            }
          }
        } catch (error) {
          console.error('[NOIRRIDE PROTOCOL] Failed to fetch draft booking from RTDB', error);
        }
      }
      
      // Fallback: new draft id and local state
      const newDraftId = `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setDraftBookingId(newDraftId);
      localStorage.setItem(getStorageKey('noir_draft_booking_id'), newDraftId);
      
      const localFallbackStr = localStorage.getItem(getStorageKey('noir_active_booking'));
      setActiveBooking(localFallbackStr ? JSON.parse(localFallbackStr) : defaultBookingState);
      setIsRehydratingDraft(false);
    };

    initializeDraftBooking();

    const rid = localStorage.getItem(getStorageKey('noir_active_ride_id'));
    setPersistedRideId(rid || null);
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('noir_rides_cache'), JSON.stringify(rides));
  }, [rides, userId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('noir_active_booking'), JSON.stringify(activeBooking));

    if (draftBookingId && !isRehydratingDraft) {
      // RTDB does not accept undefined values, so we sanitize the object
      const sanitizedState = Object.fromEntries(
        Object.entries(activeBooking).filter(([_, v]) => v !== undefined)
      );

      set(ref(rtdb, `draft_bookings/${draftBookingId}`), {
        state: sanitizedState,
        updatedAt: Date.now(),
        userId: userId
      }).catch(err => console.warn('[NOIRRIDE PROTOCOL] Error syncing draft to RTDB (Check Firebase Rules):', err.message));
    }
  }, [activeBooking, draftBookingId, isRehydratingDraft, userId]);

  useEffect(() => {
    if (persistedRideId) {
      localStorage.setItem(getStorageKey('noir_active_ride_id'), persistedRideId);
    } else {
      localStorage.removeItem(getStorageKey('noir_active_ride_id'));
    }
  }, [persistedRideId, userId]);

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
  }, [vehicles, activeBooking.serviceType, activeBooking.distanceMeters, activeBooking.durationSeconds, userId, isAdmin, confirmedRide?.id]);

  // Sync live fleet status from Realtime Server
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
      } catch (err) {
        console.warn('[NOIRRIDE PROTOCOL] Could not sync initial fleet status', err);
      }
    };

    fetchFleet();

    let q;
    if (isAdmin) {
      q = collection(db, 'rides');
    } else if (userId !== 'guest') {
      q = firestoreQuery(collection(db, 'rides'), where('userId', '==', userId));
    } else if (persistedRideId) {
      q = firestoreQuery(collection(db, 'rides'), where(documentId(), '==', persistedRideId));
    }
    
    let unsubscribeRides: () => void;
    if (q) {
      unsubscribeRides = onSnapshot(q, (snapshot) => {
        const fetchedRides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
        // Sort by creation date descending (newest first)
        fetchedRides.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        if (userId === 'guest') {
          // Guests only fetch their active ride, so we must merge it into the cache to not lose history
          setRides((prev) => {
            const merged = new Map(prev.map(r => [r.id, r]));
            fetchedRides.forEach(r => merged.set(r.id, r));
            const arr = Array.from(merged.values());
            arr.sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            });
            return arr;
          });
        } else {
          // Preserve existing rides if no new data fetched to keep active ride visible
          if (fetchedRides.length > 0) {
            setRides(fetchedRides);
          } else {
            setRides(prev => prev);
          }
        }
        
        if (!isAdmin) {
          if (fetchedRides.length > 0) {
            const active = fetchedRides.find(r => ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
            const selected = active || null;
            setConfirmedRide(selected);
            if (userId === 'guest') {
              setPersistedRideId(selected ? selected.id : null);
            }
          } else {
            // No rides fetched. Fall back to any cached active ride if present
            setRides((prevRides) => {
              const cachedActive = prevRides.find(r => ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
              if (cachedActive) {
                setConfirmedRide(cachedActive);
                if (userId === 'guest') {
                  setPersistedRideId(cachedActive.id);
                }
              } else {
                setConfirmedRide(null);
                if (userId === 'guest') {
                  setPersistedRideId(null);
                }
              }
              return prevRides;
            });
          }
        } else {
          // Admin needs to see their own active rides too if they're acting as a client
          const adminOwnActive = fetchedRides.find(r => r.userId === userId && ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
          
          setConfirmedRide((prev) => {
            if (adminOwnActive) return adminOwnActive;
            if (!prev) return null;
            const updated = fetchedRides.find(r => r.id === prev.id);
            return updated || prev;
          });
        }
      });
    } else {
      unsubscribeRides = () => {};
    }

    // Setup global RTDB connection for real-time status sync
    const fleetUpdatesRef = rtdbQuery(
      ref(rtdb, 'fleet_updates'), 
      orderByChild('timestamp'), 
      startAt(Date.now())
    );

    const unsubscribe = onChildAdded(fleetUpdatesRef, (snapshot) => {
      try {
        const parsed = snapshot.val();
        if (!parsed) return;
        
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
          // Handled natively by Firestore onSnapshot
        } 
        else if (parsed.type === 'RIDE_ADDED') {
          // Handled natively by Firestore onSnapshot
        } 
        else if (parsed.type === 'RIDE_COMPLETED') {
          // Ride array update handled natively by Firestore onSnapshot
          
          // Re-mark driver available after ride completion
          setDrivers(prevDrivers => 
            prevDrivers.map(d => 
              d.id === parsed.driverId ? { ...d, status: 'AVAILABLE' } : d
            )
          );
        }
      } catch (e) {
        console.warn('[NOIRRIDE PROTOCOL] RTDB parse error in RideContext:', e);
      }
    });

    return () => {
      unsubscribeRides();
      unsubscribe();
    };
  }, [userId, isAdmin, persistedRideId]);

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
    // Prevent multiple active bookings for the same user
    const hasActiveRide = rides.some(r => 
      r.customerEmail === customerDetails.email && 
      ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'].includes(r.status)
    );
    if (hasActiveRide) {
      throw new Error("You already have an active reservation. Please complete or cancel it before booking a new dispatch.");
    }

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
    
    // Clear draft booking
    if (draftBookingId) {
      set(ref(rtdb, `draft_bookings/${draftBookingId}`), null).catch(() => {});
      const newDraftId = `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setDraftBookingId(newDraftId);
      localStorage.setItem(getStorageKey('noir_draft_booking_id'), newDraftId);
    }
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
        isRehydratingDraft,
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

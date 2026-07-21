import { Request, Response } from 'express';
import { SafeRedis } from './redis';

export interface VehicleRate {
  id: string;
  name: string;
  basePrice: number;
  ratePerKm: number;
  ratePerHour: number;
}

export const VEHICLE_RATES: Record<string, VehicleRate> = {
  'veh-4': {
    id: 'veh-4',
    name: 'Rolls-Royce Phantom VIII',
    basePrice: 450,
    ratePerKm: 12.0,
    ratePerHour: 350
  },
  'veh-1': {
    id: 'veh-1',
    name: 'Mercedes-Benz S-Class (Maybach Executive)',
    basePrice: 220,
    ratePerKm: 6.5,
    ratePerHour: 180
  },
  'veh-2': {
    id: 'veh-2',
    name: 'Cadillac Escalade ESV (Armored B6)',
    basePrice: 650,
    ratePerKm: 18.0,
    ratePerHour: 500
  },
  'veh-3': {
    id: 'veh-3',
    name: 'Mercedes-Benz V-Class VIP Lounge',
    basePrice: 300,
    ratePerKm: 8.0,
    ratePerHour: 220
  },
  'veh-5': {
    id: 'veh-5',
    name: 'BMW 7 Series Protection (i7 Armored VR9)',
    basePrice: 750,
    ratePerKm: 20.0,
    ratePerHour: 580
  },
  'veh-6': {
    id: 'veh-6',
    name: 'Bentley Mulsanne Extended Wheelbase',
    basePrice: 380,
    ratePerKm: 10.0,
    ratePerHour: 300
  }
};

export const calculatePriceHandler = async (req: Request, res: Response) => {
  try {
    const {
      vehicleId = 'veh-4',
      serviceType = 'airport',
      distanceMeters = 0,
      durationSeconds = 0
    } = req.body || {};

    const vehicle = VEHICLE_RATES[vehicleId] || VEHICLE_RATES['veh-4'];
    
    // Construct Redis cache key based on route parameters
    const distBucket = Math.round(Number(distanceMeters) / 500); // 500m buckets
    const durBucket = Math.round(Number(durationSeconds) / 300); // 5 min buckets
    const cacheKey = `fare:v1:${vehicle.id}:${serviceType}:${distBucket}:${durBucket}`;

    let redisErrorOccurred = false;

    // Try reading cached calculation from Redis
    try {
      const cached = await SafeRedis.safeGet(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json({
          ...parsed,
          redisCacheHit: true,
          redisErrorHandled: false,
          redisConnected: SafeRedis.isConnected()
        });
      }
    } catch (err: any) {
      console.warn('[PriceController] Redis cache read failed, falling back to calculation:', err.message || err);
      redisErrorOccurred = true;
    }

    // Distance and Duration Math
    const distanceKm = Number(distanceMeters) / 1000;
    const durationHours = Number(durationSeconds) / 3600;

    let baseFare = vehicle.basePrice;
    let distanceFare = 0;
    let timeFare = 0;

    if (serviceType === 'hourly') {
      const billableHours = Math.max(4, Math.ceil(durationHours));
      baseFare = vehicle.ratePerHour * billableHours;
      timeFare = baseFare;
    } else {
      distanceFare = Math.round(distanceKm * vehicle.ratePerKm);
      baseFare = Math.max(vehicle.basePrice, vehicle.basePrice + distanceFare);
    }

    const serviceFee = Math.round(baseFare * 0.12);
    const tax = Math.round((baseFare + serviceFee) * 0.0887);
    const total = Math.round(baseFare + serviceFee + tax);

    const priceResult = {
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      serviceType,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: Math.round(Number(durationSeconds) / 60),
      baseFare,
      distanceFare,
      timeFare,
      serviceFee,
      tax,
      total,
      currency: 'USD',
      redisCacheHit: false,
      redisErrorHandled: redisErrorOccurred || !SafeRedis.isConnected(),
      redisConnected: SafeRedis.isConnected()
    };

    // Cache calculation in Redis asynchronously with 1-hour TTL
    if (SafeRedis.isConnected()) {
      SafeRedis.safeSet(cacheKey, JSON.stringify(priceResult), 3600).catch((err) => {
        console.warn('[PriceController] SafeRedis write cache failed silently:', err.message || err);
      });
    }

    return res.json(priceResult);
  } catch (error: any) {
    console.error('[PriceController Error] Internal error during price calculation:', error);
    
    // Emergency Fallback if anything unexpected happens
    return res.status(200).json({
      vehicleId: req.body?.vehicleId || 'veh-4',
      baseFare: 220,
      serviceFee: 26,
      tax: 22,
      total: 268,
      currency: 'USD',
      redisCacheHit: false,
      redisErrorHandled: true,
      fallbackUsed: true
    });
  }
};

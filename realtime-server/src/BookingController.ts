import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleMapsService } from './GoogleMapsService';
import { FleetManager } from './FleetManager';

export const dispatchBooking = async (req: Request, res: Response) => {
  try {
    const { rideId, pickupLocation, destination, pickupCoords, destCoords, preferredDriverId } = req.body as any;
    
    if (!rideId || !pickupLocation || !destination) {
      return res.status(400).json({ error: 'Missing rideId, pickupLocation, or destination.' });
    }

    let rideRef = null;
    try {
      const db = getFirestore('noirride');
      rideRef = db.collection('rides').doc(rideId);
    } catch(err) {
      console.warn('[Dispatch] Error fetching Firestore:', err);
    }

    // Use coordinates from frontend if provided, otherwise fallback to Geocoding API
    const finalPickupCoords = pickupCoords || await GoogleMapsService.geocodeAddress(pickupLocation);
    const finalDestCoords = destCoords || await GoogleMapsService.geocodeAddress(destination);

    const driver = preferredDriverId 
      ? FleetManager.getDriver(preferredDriverId) 
      : FleetManager.findBestDriver(finalPickupCoords);
    
    if (!driver) {
      return res.status(404).json({ error: 'Toți șoferii noștri sunt complet ocupați cu comenzi în așteptare.' });
    }

    if (!driver.isAvailable) {
      // Queue the ride for this driver
      driver.queuedRide = {
        rideId,
        pickupCoords: finalPickupCoords,
        destCoords: finalDestCoords,
        pickupLocation,
        destination
      };
      
      if (rideRef) {
        await rideRef.set({
          driverId: driver.id,
          driverName: driver.name,
          status: 'SCHEDULED', // It will stay scheduled until the driver finishes current ride
          pickup: finalPickupCoords,
          destinationCoords: finalDestCoords
        }, { merge: true });
      }

      return res.status(200).json({
        message: 'Cursa a fost pusă în așteptare pentru cel mai apropiat șofer.',
        rideId,
        driverId: driver.id,
        status: 'SCHEDULED'
      });
    }

    // Driver is available, assign immediately
    const routeToPickup = await GoogleMapsService.getRoute(driver.location, finalPickupCoords);
    const routeToDest = await GoogleMapsService.getRoute(finalPickupCoords, finalDestCoords);

    const totalEtaSeconds = routeToPickup.duration + routeToDest.duration;
    // We store rawGeometry so the frontend can draw a clean, exact path
    const fullRawGeometry = [...routeToPickup.rawGeometry, ...routeToDest.rawGeometry];

    FleetManager.setDriverBusy(driver.id, finalDestCoords, rideId);

    // Update the existing ride in Firestore with the route data, no auto-simulation
    try {
      if (rideRef) {
        await rideRef.set({
          driverId: driver.id,
          driverName: driver.name,
          status: 'EN_ROUTE', // Status matches production expectation
          etaSeconds: totalEtaSeconds,
          currentEta: totalEtaSeconds,
          pickup: finalPickupCoords, // Save exact coordinates for frontend map
          destinationCoords: finalDestCoords,
          routePolyline: fullRawGeometry // Drawn on frontend maps immediately
        }, { merge: true });
      }
      
      const db = getFirestore('noirride');
      await db.collection('drivers').doc(driver.id).set({
        location: driver.location,
        status: 'busy',
        currentRideId: rideId,
        lastUpdate: Date.now()
      }, { merge: true });

    } catch (err: any) {
      console.warn('[Dispatch] Could not update ride in Firestore.', err.message);
    }

    return res.status(200).json({
      message: 'Driver successfully dispatched (Production Architecture).',
      rideId,
      driverId: driver.id,
      driverName: driver.name,
      initialEta: totalEtaSeconds,
      status: 'EN_ROUTE',
      routePolyline: fullRawGeometry
    });

  } catch (error) {
    console.error('[Dispatch] Eroare la dispatching:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: String(error) });
  }
};

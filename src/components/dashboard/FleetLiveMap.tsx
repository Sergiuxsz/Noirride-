import React, { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, rtdb } from '../../lib/firebase';
import { ref, onChildAdded, onValue, query, startAt, orderByChild } from 'firebase/database';
import { useGoogleMapsScript } from '../../hooks/useGoogleMapsScript';
import { getVehicleMarkerSVG } from '../map/VehicleMarkerIcons';
import { useTranslation } from 'react-i18next';

interface DriverState {
  id: string;
  name: string;
  status: string;
  startPos: { lat: number; lng: number };
  targetPos: { lat: number; lng: number };
  lastUpdate: number;
  bearing: number;
  marker?: google.maps.marker.AdvancedMarkerElement;
  container?: HTMLDivElement;
  carElement?: HTMLDivElement;
}

interface ActiveRouteGraphics {
  polyline: google.maps.Polyline;
  pickupMarker: google.maps.marker.AdvancedMarkerElement;
  destMarker: google.maps.marker.AdvancedMarkerElement;
  driverId?: string;
  customerName?: string;
  etaSeconds?: number;
}

const DRIVER_COLORS: Record<string, string> = {
  'drv-1': '#FFD700', // Gold
  'drv-2': '#00E5FF', // Cyan
  'drv-3': '#FF3D00', // Orange-Red
  'drv-4': '#B388FF', // Purple
};

export const getDriverColor = (driverId: string | undefined) => {
  return driverId && DRIVER_COLORS[driverId] ? DRIVER_COLORS[driverId] : '#D4AF37'; // Default Gold
};

export const FleetLiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, error } = useGoogleMapsScript();
  const [isConnected, setIsConnected] = useState(true); // Always connected to Firestore
  const driversRef = useRef<Map<string, DriverState>>(new Map());
  const routesRef = useRef<Map<string, ActiveRouteGraphics>>(new Map());
  const animationRef = useRef<number>();
  const { t } = useTranslation();

  const updateDriverLabel = (driver: DriverState) => {
    if (!driver.container || !driver.container.firstChild) return;
    let labelText = driver.name;
    if (driver.status === 'busy') {
      const activeRoute = Array.from(routesRef.current.values()).find(r => r.driverId === driver.id);
      if (activeRoute && activeRoute.customerName) {
        const eta = activeRoute.etaSeconds ? ` (ETA: ${Math.ceil(activeRoute.etaSeconds / 60)} min)` : '';
        labelText = `${driver.name} | ${activeRoute.customerName}${eta}`;
      } else {
        labelText = `${driver.name} ${t('dispatch.busy', '(Busy)')}`;
      }
    }
    (driver.container.firstChild as HTMLElement).innerText = labelText;
  };

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 44.4268, lng: 26.1025 },
      zoom: 12,
      disableDefaultUI: true,
      backgroundColor: '#12141C',
      mapId: 'DEMO_MAP_ID',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
      ]
    });

    setMap(newMap);
  }, [isLoaded]);

  // Handle RTDB Telemetry (Drivers)
  useEffect(() => {
    if (!map || !isLoaded) return;

    const driversRefNode = ref(rtdb, 'drivers');
    const unsubscribeDrivers = onValue(driversRefNode, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      const now = performance.now();
      const currentDocIds = new Set<string>();

      Object.keys(data).forEach((id) => {
        const driverData = data[id];
        if (!driverData.location) return; // Ignore drivers without location

        currentDocIds.add(id);
        const coords = driverData.location;
        const driverName = driverData.name || id;
        const status = (driverData.isAvailable ?? true) ? 'available' : 'busy';

        const existing = driversRef.current.get(id);

        if (!existing) {
          // Create DOM node for marker
          const container = document.createElement('div');
          container.style.position = 'relative';
          container.style.display = 'flex';
          container.style.flexDirection = 'column';
          container.style.alignItems = 'center';

          const label = document.createElement('div');
          label.innerText = driverName;
          label.style.color = '#FFFFFF';
          label.style.fontFamily = 'sans-serif';
          label.style.fontSize = '12px';
          label.style.fontWeight = 'bold';
          label.style.textShadow = '0px 0px 4px #000000, 0px 0px 4px #000000';
          label.style.marginBottom = '4px';
          label.style.whiteSpace = 'nowrap';
          container.appendChild(label);

          const carElement = document.createElement('div');
          carElement.innerHTML = getVehicleMarkerSVG(id);
          carElement.style.transformOrigin = 'center center';
          container.appendChild(carElement);

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: coords,
            map: map,
            content: container,
            zIndex: status === 'available' ? 50 : 100
          });

          const newDriver: DriverState = {
            id,
            name: driverName,
            status,
            startPos: coords,
            targetPos: coords,
            lastUpdate: now,
            bearing: 0,
            marker,
            container,
            carElement
          };
          driversRef.current.set(id, newDriver);
          updateDriverLabel(newDriver);
        } else {
          // Update position interpolation targets
          const elapsed = (now - existing.lastUpdate) / 1000;
          const lerpProgress = Math.min(elapsed, 1.0);
          const currentLat = existing.startPos.lat + (existing.targetPos.lat - existing.startPos.lat) * lerpProgress;
          const currentLng = existing.startPos.lng + (existing.targetPos.lng - existing.startPos.lng) * lerpProgress;
          
          let bearing = existing.bearing;
          if (coords.lat !== existing.targetPos.lat || coords.lng !== existing.targetPos.lng) {
            const dy = coords.lat - existing.targetPos.lat;
            const dx = coords.lng - existing.targetPos.lng;
            bearing = Math.atan2(dx, dy) * 180 / Math.PI;
            if (bearing < 0) bearing += 360;
          }

          existing.startPos = { lat: currentLat, lng: currentLng };
          existing.targetPos = coords;
          existing.lastUpdate = now;
          existing.bearing = bearing;
          existing.status = status;

          if (existing.marker) {
            existing.marker.zIndex = status === 'busy' ? 100 : 50;
          }

          updateDriverLabel(existing);
        }
      });

      // Cleanup drivers that are no longer in RTDB
      driversRef.current.forEach((driver, id) => {
        if (!currentDocIds.has(id)) {
          if (driver.marker) driver.marker.map = null;
          driversRef.current.delete(id);
        }
      });
    });

    return () => {
      unsubscribeDrivers();
    };
  }, [map, isLoaded]);

  // Handle Firestore Routes (Rides)
  useEffect(() => {
    if (!map || !isLoaded) return;

    const unsubscribeRides = onSnapshot(collection(db, 'rides'), (snapshot) => {
      const currentRideIds = new Set<string>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const rideId = doc.id;
        currentRideIds.add(rideId);
        const status = data.status;
        const isActiveRide = status === 'EN_ROUTE' || status === 'ARRIVED' || status === 'IN_PROGRESS';

        if (isActiveRide && Array.isArray(data.routePolyline) && data.routePolyline.length > 0) {
          if (!routesRef.current.has(rideId)) {
            const driverId = data.driverId;
            const driverColor = getDriverColor(driverId);
            const path = data.routePolyline.map((p: any) => ({ lat: p.lat, lng: p.lng }));

            const polyline = new google.maps.Polyline({
              path: path,
              map: map,
              strokeColor: driverColor,
              strokeWeight: 6,
              strokeOpacity: 0.95,
              zIndex: 80
            });

            // Pickup Marker
            const pickupCoords = path[0];
            const pickupEl = document.createElement('div');
            pickupEl.className = 'relative flex items-center justify-center w-7 h-7';
            pickupEl.innerHTML = `
              <div class="absolute w-5 h-5 rounded-full animate-pulse-ring" style="background-color: ${driverColor}40"></div>
              <div class="w-3 h-3 rounded-full border-2 z-10 shadow-lg" style="background-color: white; border-color: ${driverColor}"></div>
            `;
            const pickupMarker = new google.maps.marker.AdvancedMarkerElement({
              position: pickupCoords,
              map: map,
              content: pickupEl,
              zIndex: 200
            });

            // Destination Marker
            const destCoords = path[path.length - 1];
            const destEl = document.createElement('div');
            destEl.className = 'flex items-center justify-center w-3.5 h-3.5 border-2 border-white rounded shadow-lg';
            destEl.style.backgroundColor = driverColor;
            destEl.style.transform = 'rotate(45deg)';
            const destMarker = new google.maps.marker.AdvancedMarkerElement({
              position: destCoords,
              map: map,
              content: destEl,
              zIndex: 200
            });

            routesRef.current.set(rideId, { polyline, pickupMarker, destMarker, driverId });
            
            // Optional: gently pan to the new route pickup
            map.panTo(pickupCoords);
          }

          const routeObj = routesRef.current.get(rideId);
          if (routeObj) {
            routeObj.customerName = data.customerName;
            routeObj.etaSeconds = data.currentEta ?? data.etaSeconds ?? data.pickupEtaSeconds;
            routeObj.driverId = data.driverId;
            
            const driver = driversRef.current.get(data.driverId);
            if (driver) updateDriverLabel(driver);
          }
        } else {
          const routeObj = routesRef.current.get(rideId);
          if (routeObj) {
            routeObj.polyline.setMap(null);
            routeObj.pickupMarker.map = null;
            routeObj.destMarker.map = null;
            routesRef.current.delete(rideId);
          }
        }
      });

      // Cleanup routes that are no longer in Firestore
      routesRef.current.forEach((routeObj, rideId) => {
        if (!currentRideIds.has(rideId)) {
          routeObj.polyline.setMap(null);
          routeObj.pickupMarker.map = null;
          routeObj.destMarker.map = null;
          routesRef.current.delete(rideId);
        }
      });
    });

    return () => {
      unsubscribeRides();
    };
  }, [map, isLoaded]);

  // Handle RTDB Telemetry
  useEffect(() => {
    if (!map || !isLoaded) return;

    const fleetUpdatesRef = query(
      ref(rtdb, 'fleet_updates'),
      orderByChild('timestamp'),
      startAt(Date.now())
    );

    const unsubscribe = onChildAdded(fleetUpdatesRef, (snapshot) => {
      try {
        const parsed = snapshot.val();
        if (!parsed) return;

        if (parsed.type === 'LOCATION_UPDATE' && parsed.driverId) {
          const driver = driversRef.current.get(parsed.driverId);
          if (driver) {
            driver.startPos = { lat: driver.targetPos.lat, lng: driver.targetPos.lng };
            driver.targetPos = parsed.location;
            driver.lastUpdate = performance.now();

            if (parsed.location.lat !== driver.startPos.lat || parsed.location.lng !== driver.startPos.lng) {
              const dy = parsed.location.lat - driver.startPos.lat;
              const dx = parsed.location.lng - driver.startPos.lng;
              let bearing = Math.atan2(dx, dy) * 180 / Math.PI;
              if (bearing < 0) bearing += 360;
              driver.bearing = bearing;
            }
          }

          if (parsed.rawGeometry) {
            routesRef.current.forEach((routeObj) => {
              if (routeObj.driverId === parsed.driverId) {
                routeObj.polyline.setPath(parsed.rawGeometry);
              }
            });
          }
        }
      } catch (e) {
        console.error('[FleetLiveMap] RTDB parse error:', e);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [map, isLoaded]);

  // Animation Loop
  useEffect(() => {
    if (!map || !isLoaded) return;

    const animateMap = () => {
      const now = performance.now();

      driversRef.current.forEach((driver) => {
        if (!driver.marker || !driver.carElement) return;

        const elapsed = (now - driver.lastUpdate) / 1000;
        const lerpProgress = Math.min(elapsed, 1.0);
        
        const lat = driver.startPos.lat + (driver.targetPos.lat - driver.startPos.lat) * lerpProgress;
        const lng = driver.startPos.lng + (driver.targetPos.lng - driver.startPos.lng) * lerpProgress;

        driver.marker.position = { lat, lng };
        driver.carElement.style.transform = `rotate(${driver.bearing}deg)`;
      });

      animationRef.current = requestAnimationFrame(animateMap);
    };

    animateMap();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [map, isLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      driversRef.current.forEach(driver => {
        if (driver.marker) driver.marker.map = null;
      });
      driversRef.current.clear();

      routesRef.current.forEach(routeObj => {
        routeObj.polyline.setMap(null);
        routeObj.pickupMarker.map = null;
        routeObj.destMarker.map = null;
      });
      routesRef.current.clear();
    };
  }, []);

  if (error) {
    return <div className="w-full h-[400px] bg-secondary flex items-center justify-center text-red-400 text-sm border border-border rounded-xl">{t('dispatch.mapError', 'Error loading map')}</div>;
  }

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-border mt-6 shadow-lg">
      <div ref={mapRef} className="absolute inset-0" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 backdrop-blur-sm z-0">
          <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="absolute top-4 right-4 bg-secondary/90 border border-border px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 backdrop-blur-sm z-10 shadow-xl">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
        <span className="text-content">
          {isConnected ? t('dispatch.telemetryActive', 'Telemetry Active (Firestore)') : t('dispatch.connecting', 'Connecting to Engine...')}
        </span>
      </div>
    </div>
  );
};

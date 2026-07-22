import React, { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGoogleMapsScript } from '../../hooks/useGoogleMapsScript';
import { getVehicleMarkerSVG } from '../map/VehicleMarkerIcons';
import { getDriverColor } from '../dashboard/FleetLiveMap';
import { useTranslation } from 'react-i18next';

interface Props {
  rideId: string;
  vehicleId?: string;
  vehicleName?: string;
  pickupLocation?: string;
  destination?: string;
  onTelemetryUpdate?: (status: string, etaSeconds: number) => void;
}

export const ClientLiveMap: React.FC<Props> = ({
  rideId,
  vehicleId,
  vehicleName,
  pickupLocation,
  destination,
  onTelemetryUpdate
}) => {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, error } = useGoogleMapsScript();
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<any>(null);
  const animationRef = useRef<number>();
  
  const stateRef = useRef({
    startPos: { lat: 0, lng: 0 },
    targetPos: { lat: 0, lng: 0 },
    lastUpdate: 0,
    hasInitialPosition: false,
    routeDrawn: false,
    bearing: 0
  });

  const carMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const pickupMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const destMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const carElementRef = useRef<HTMLDivElement | null>(null);

  const socket = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number>();
  const activeDriverId = useRef<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 44.4268, lng: 26.1025 },
      zoom: 14,
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

    setTimeout(() => {
      google.maps.event.trigger(newMap, 'resize');
    }, 150);
  }, [isLoaded]);

  // Handle Firestore Telemetry
  useEffect(() => {
    if (!rideId) return;

    let unsubscribeDriver: (() => void) | undefined;
    
    const unsubscribeRide = onSnapshot(doc(db, 'rides', rideId), (rideDoc) => {
      if (!rideDoc.exists()) return;
      
      const rideData = rideDoc.data();
      const driverId = rideData.driverId;
      activeDriverId.current = driverId;

      const currentEtaValue = rideData.currentEta ?? rideData.etaSeconds ?? rideData.pickupEtaSeconds ?? 300;

      if (onTelemetryUpdate) {
        onTelemetryUpdate(rideData.status, currentEtaValue);
      }

      // Update telemetry geometry from ride
      setTelemetry((prev: any) => ({
        ...prev,
        lat: prev?.lat || rideData.pickup?.lat,
        lng: prev?.lng || rideData.pickup?.lng,
        rawGeometry: rideData.routePolyline,
        status: rideData.status,
        currentEta: currentEtaValue
      }));

      // Listen to assigned driver for fallback (every 5s) if WS fails
      if (driverId && !unsubscribeDriver) {
        unsubscribeDriver = onSnapshot(doc(db, 'drivers', driverId), (driverDoc) => {
          if (!driverDoc.exists()) return;
          const driverData = driverDoc.data();
          
          if (driverData.location) {
            setTelemetry((prev: any) => ({
              ...prev,
              lat: prev?.lat && isConnected ? prev.lat : driverData.location.lat,
              lng: prev?.lng && isConnected ? prev.lng : driverData.location.lng,
              rawGeometry: prev?.rawGeometry || rideData.routePolyline,
              status: rideData.status,
              currentEta: rideData.currentEta || rideData.etaSeconds
            }));
          }
        });
      }
    });

    return () => {
      unsubscribeRide();
      if (unsubscribeDriver) unsubscribeDriver();
    };
  }, [rideId, onTelemetryUpdate, isConnected]);

  // Handle Socket & Telemetry via Native WebSocket
  useEffect(() => {
    if (!map || !isLoaded) return;

    const connectWs = () => {
      const serverUrl = import.meta.env.VITE_REALTIME_SERVER_WS_URL || 'ws://localhost:8080/ws/fleet';
      const ws = new WebSocket(serverUrl);
      socket.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout.current = window.setTimeout(() => connectWs(), 3000);
      };

      ws.onerror = (err) => {
        console.error('[ClientLiveMap] WebSocket error:', err);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'LOCATION_UPDATE' && parsed.driverId === activeDriverId.current) {
            setTelemetry((prev: any) => ({
              ...prev,
              lat: parsed.location.lat,
              lng: parsed.location.lng,
              rawGeometry: parsed.rawGeometry || prev?.rawGeometry
            }));
          }
        } catch (e) {
          console.error('[ClientLiveMap] Message parse error:', e);
        }
      };
    };

    connectWs();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (socket.current) socket.current.close();
    };
  }, [map, isLoaded]);

  // Helper to draw polyline route
  const drawRoutePolyline = (path: google.maps.LatLngLiteral[]) => {
    if (!map || stateRef.current.routeDrawn || !path || path.length === 0) return;
    stateRef.current.routeDrawn = true;

    const driverColor = getDriverColor(vehicleId);

    routePolylineRef.current = new google.maps.Polyline({
      path: path,
      map: map,
      strokeColor: driverColor,
      strokeWeight: 6,
      strokeOpacity: 0.85
    });

    // Pickup Marker
    const pickupCoords = path[0];
    const pickupEl = document.createElement('div');
    pickupEl.className = 'relative flex items-center justify-center w-8 h-8';
    pickupEl.innerHTML = `
      <div class="absolute w-6 h-6 rounded-full animate-pulse-ring" style="background-color: ${driverColor}40"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-white border-2 z-10 shadow-lg" style="border-color: ${driverColor}; box-shadow: 0 4px 6px ${driverColor}35;"></div>
    `;
    if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
    pickupMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      position: pickupCoords,
      map: map,
      content: pickupEl
    });

    // Destination Marker
    const destCoords = path[path.length - 1];
    const destEl = document.createElement('div');
    destEl.className = 'flex items-center justify-center w-4 h-4 border-2 border-white rounded shadow-lg';
    destEl.style.backgroundColor = driverColor;
    destEl.style.boxShadow = `0 4px 6px ${driverColor}35`;
    destEl.style.transform = 'rotate(45deg)';
    if (destMarkerRef.current) destMarkerRef.current.map = null;
    destMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      position: destCoords,
      map: map,
      content: destEl
    });

    // Fit map bounds
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { top: 40, right: 40, bottom: 140, left: 40 });
  };

  // Fallback Route Drawing if Directions available or rawGeometry emitted
  useEffect(() => {
    if (!map || !isLoaded || stateRef.current.routeDrawn) return;

    if (telemetry && telemetry.rawGeometry && telemetry.rawGeometry.length > 0) {
      drawRoutePolyline(telemetry.rawGeometry);
      return;
    }

    if (pickupLocation && destination && window.google?.maps?.DirectionsService) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: pickupLocation,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result?.routes[0]?.overview_path) {
            const path = result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
            drawRoutePolyline(path);
          }
        }
      );
    }
  }, [map, isLoaded, telemetry, pickupLocation, destination]);

  // Sync Telemetry position & vehicle marker
  useEffect(() => {
    if (!map || !isLoaded || !telemetry) return;
    if (telemetry.lat === undefined || telemetry.lng === undefined) return;

    const coords = { lat: telemetry.lat, lng: telemetry.lng };
    const now = performance.now();

    if (!stateRef.current.hasInitialPosition) {
      stateRef.current.startPos = coords;
      stateRef.current.targetPos = coords;
      stateRef.current.lastUpdate = now;
      stateRef.current.hasInitialPosition = true;
      map.panTo(coords);
      
      // Initialize vehicle-specific marker DOM element
      const carEl = document.createElement('div');
      carEl.innerHTML = getVehicleMarkerSVG(vehicleId || vehicleName);
      carEl.style.transform = 'translate(-50%, -50%)';
      carEl.style.position = 'absolute';
      carElementRef.current = carEl;
      
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.appendChild(carEl);

      if (carMarkerRef.current) carMarkerRef.current.map = null;
      carMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        position: coords,
        map: map,
        content: container,
        zIndex: 100
      });
    } else {
      const elapsed = (now - stateRef.current.lastUpdate) / 1000;
      const t = Math.min(elapsed, 1.0);
      const currentLat = stateRef.current.startPos.lat + (stateRef.current.targetPos.lat - stateRef.current.startPos.lat) * t;
      const currentLng = stateRef.current.startPos.lng + (stateRef.current.targetPos.lng - stateRef.current.startPos.lng) * t;
      
      if (coords.lat !== stateRef.current.targetPos.lat || coords.lng !== stateRef.current.targetPos.lng) {
        const dy = coords.lat - stateRef.current.targetPos.lat;
        const dx = coords.lng - stateRef.current.targetPos.lng;
        let bearing = Math.atan2(dx, dy) * 180 / Math.PI;
        if (bearing < 0) bearing += 360;
        stateRef.current.bearing = bearing;
      }

      stateRef.current.startPos = { lat: currentLat, lng: currentLng };
      stateRef.current.targetPos = coords;
      stateRef.current.lastUpdate = now;
    }
  }, [map, isLoaded, telemetry, vehicleId, vehicleName]);

  // Telemetry loop animation thread
  useEffect(() => {
    if (!map || !isLoaded) return;

    const animateMap = () => {
      if (!carMarkerRef.current || !carElementRef.current || !stateRef.current.hasInitialPosition) {
        animationRef.current = requestAnimationFrame(animateMap);
        return;
      }

      const now = performance.now();
      const elapsed = (now - stateRef.current.lastUpdate) / 1000;
      const t = Math.min(elapsed, 1.0);
      
      const lat = stateRef.current.startPos.lat + (stateRef.current.targetPos.lat - stateRef.current.startPos.lat) * t;
      const lng = stateRef.current.startPos.lng + (stateRef.current.targetPos.lng - stateRef.current.startPos.lng) * t;

      carMarkerRef.current.position = { lat, lng };
      carElementRef.current.style.transform = `translate(-50%, -50%) rotate(${stateRef.current.bearing}deg)`;

      animationRef.current = requestAnimationFrame(animateMap);
    };

    animateMap();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [map, isLoaded]);

  // Global Cleanups on Unmount
  useEffect(() => {
    return () => {
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
      if (pickupMarkerRef.current) pickupMarkerRef.current.map = null;
      if (destMarkerRef.current) destMarkerRef.current.map = null;
      if (carMarkerRef.current) carMarkerRef.current.map = null;
    };
  }, []);

  if (error) {
    return <div className="w-full h-[320px] bg-secondary flex items-center justify-center text-red-400 text-sm border border-border rounded-xl">{t('trip.errorLoadingMap', 'Error loading map')}</div>;
  }

  return (
    <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-border mt-6 shadow-lg block">
      <div ref={mapRef} className="absolute inset-0 w-full h-full block" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 backdrop-blur-sm z-0">
          <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="absolute top-4 right-4 bg-secondary/90 border border-border px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 backdrop-blur-sm z-10 shadow-xl">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
        <span className="text-content">
          {isConnected ? t('trip.telemetryActive', 'Telemetry Active (Live GPS)') : t('trip.connecting', 'Connecting...')}
        </span>
      </div>
    </div>
  );
};

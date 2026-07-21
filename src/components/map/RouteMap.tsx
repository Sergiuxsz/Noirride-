import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMapsScript } from '../../hooks/useGoogleMapsScript';

interface RouteMapProps {
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteCalculated?: (distanceMeters: number, durationSeconds: number) => void;
  onLocationDragEnd?: (type: 'pickup' | 'destination', newLocation: { lat: number, lng: number }) => void;
}

export const RouteMap: React.FC<RouteMapProps> = ({ pickup, destination, onRouteCalculated, onLocationDragEnd }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isLoaded, error } = useGoogleMapsScript();

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    // Initialize Map with custom dark styling to match NoirRide
    const newMap = new google.maps.Map(mapRef.current, {
      center: pickup,
      zoom: 13,
      disableDefaultUI: true,
      backgroundColor: '#12141C',
      mapId: 'NOIR_RIDE_MAP_ID', // Required for AdvancedMarkerElement
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        {
          featureType: 'administrative.locality',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#263c3f' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#6b9a76' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#38414e' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#212a37' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9ca5b3' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#746855' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#1f2835' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#f3d19c' }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#2f3948' }]
        },
        {
          featureType: 'transit.station',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#d59563' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#17263c' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#515c6d' }]
        },
        {
          featureType: 'water',
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#17263c' }]
        }
      ]
    });

    setMap(newMap);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    let currentPolyline: google.maps.Polyline | null = null;
    let pickupMarker: google.maps.marker.AdvancedMarkerElement | null = null;
    let destMarker: google.maps.marker.AdvancedMarkerElement | null = null;

    const fetchRoute = async () => {
      try {
        const directionsService = new google.maps.DirectionsService();

        directionsService.route({
          origin: pickup,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            const route = result.routes[0];
            const leg = route.legs[0];
            
            const distanceMeters = leg.distance?.value || 0;
            const durationSeconds = leg.duration?.value || 0;

            if (onRouteCalculated) {
              onRouteCalculated(distanceMeters, durationSeconds);
            }

            const decodedPath = route.overview_path;

            // Draw Polyline
            currentPolyline = new google.maps.Polyline({
              path: decodedPath,
              map: map,
              strokeColor: '#D4AF37',
              strokeWeight: 5,
              strokeOpacity: 0.8
            });

            // Create custom HTML elements for AdvancedMarkerElement
            const pickupContent = document.createElement('div');
            pickupContent.style.width = '14px';
            pickupContent.style.height = '14px';
            pickupContent.style.backgroundColor = '#FFFFFF';
            pickupContent.style.border = '2px solid #D4AF37';
            pickupContent.style.borderRadius = '50%';

            const destContent = document.createElement('div');
            destContent.style.width = '12px';
            destContent.style.height = '12px';
            destContent.style.backgroundColor = '#D4AF37';
            destContent.style.border = '2px solid #FFFFFF';
            destContent.style.borderRadius = '2px';
            destContent.style.transform = 'rotate(45deg)';

            // Draw Custom Advanced Markers
            pickupMarker = new google.maps.marker.AdvancedMarkerElement({
              position: pickup,
              map: map,
              content: pickupContent,
              title: 'Pickup',
              gmpDraggable: true
            });

            destMarker = new google.maps.marker.AdvancedMarkerElement({
              position: destination,
              map: map,
              content: destContent,
              title: 'Destination',
              gmpDraggable: true
            });

            if (onLocationDragEnd) {
              pickupMarker.addListener('dragend', (event: any) => {
                if (event.latLng) {
                  onLocationDragEnd('pickup', { lat: event.latLng.lat(), lng: event.latLng.lng() });
                }
              });

              destMarker.addListener('dragend', (event: any) => {
                if (event.latLng) {
                  onLocationDragEnd('destination', { lat: event.latLng.lat(), lng: event.latLng.lng() });
                }
              });
            }

            // Fit bounds
            const bounds = new google.maps.LatLngBounds();
            decodedPath.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
          } else {
            console.error('Directions request failed due to ' + status);
          }
        });
      } catch (err) {
        console.error('Error fetching routes API:', err);
      }
    };

    fetchRoute();

    return () => {
      if (currentPolyline) currentPolyline.setMap(null);
      if (pickupMarker) pickupMarker.map = null;
      if (destMarker) destMarker.map = null;
    };
  }, [pickup, destination, isLoaded, map]);

  if (error) {
    return <div className="w-full h-full bg-[#12141C] flex items-center justify-center text-red-400 text-sm border border-white/10 rounded-2xl">Error loading map</div>;
  }

  return (
    <div className="w-full h-[250px] sm:h-[350px] bg-[#12141C] rounded-2xl overflow-hidden border border-white/10 shadow-lg relative">
      <div ref={mapRef} className="absolute inset-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#12141C]/80 backdrop-blur-sm">
          <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

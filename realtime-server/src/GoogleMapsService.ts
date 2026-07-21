import axios from 'axios';
import { Location } from './types';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const GOOGLE_GEOCODING_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY || GOOGLE_MAPS_API_KEY;

export class GoogleMapsService {
  /**
   * Geocodes a text address into Location (lng, lat)
   */
  static async geocodeAddress(address: string): Promise<Location> {
    if (!GOOGLE_GEOCODING_API_KEY) {
      console.warn('[GoogleMapsService] Nu este setată GOOGLE_GEOCODING_API_KEY. Folosesc coordonate fallback pentru', address);
      return { lat: 44.4268, lng: 26.1025 }; // Fallback București centru
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODING_API_KEY}`;
      const response = await axios.get(url);

      if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
        console.warn(`[GoogleMapsService] Geocoding API Error: ${response.data.status} for address: ${address}. Using fallback.`);
        return { lat: 44.4268, lng: 26.1025 };
      }

      const location = response.data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } catch (error) {
      console.error('[GoogleMapsService] Eroare la geocoding:', error);
      return { lat: 44.4268, lng: 26.1025 }; // Fallback București centru
    }
  }

  /**
   * Gets driving route considering real-time traffic using Directions API
   */
  static async getRoute(start: Location, end: Location): Promise<{ duration: number, routeGeometry: Location[], rawGeometry: Location[] }> {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('[GoogleMapsService] Nu este setată GOOGLE_MAPS_API_KEY. Folosesc rută fallback.');
      return {
        duration: 300,
        routeGeometry: [start, end],
        rawGeometry: [start, end]
      };
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&departure_time=now&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('Google Directions API returned no routes. Check API Key restrictions.');
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      // duration in seconds
      const duration = leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value;
      const polyline = route.overview_polyline.points;

      const rawGeometry = this.decodePolyline(polyline);
      const routeGeometry = this.interpolatePolyline(rawGeometry, duration);
      
      return { duration, routeGeometry, rawGeometry };
    } catch (error) {
      console.error('[GoogleMapsService] Eroare la obținerea rutei (Directions API):', error);
      throw error;
    }
  }

  /**
   * Decodes Google Maps encoded polyline into array of Locations
   */
  private static decodePolyline(encoded: string): Location[] {
    const poly: Location[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      const p = {
        lat: lat / 1e5,
        lng: lng / 1e5
      };
      poly.push(p);
    }
    return poly;
  }

  /**
   * Interpolates a list of Locations so that we have exactly `numPoints` evenly spaced along the path.
   * This ensures the simulation advances at a constant real-world speed over the `duration` seconds.
   */
  private static interpolatePolyline(rawGeometry: Location[], numPoints: number): Location[] {
    if (rawGeometry.length === 0) return [];
    if (rawGeometry.length === 1 || numPoints <= 1) return [rawGeometry[0]];

    // 1. Calculate cumulative distances
    const dists = [0];
    let totalDist = 0;
    for (let i = 1; i < rawGeometry.length; i++) {
      const p1 = rawGeometry[i - 1];
      const p2 = rawGeometry[i];
      // Haversine formula approximation for short distances in meters
      const R = 6371e3; // Earth radius
      const lat1 = p1.lat * Math.PI / 180;
      const lat2 = p2.lat * Math.PI / 180;
      const dLat = (p2.lat - p1.lat) * Math.PI / 180;
      const dLng = (p2.lng - p1.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      totalDist += d;
      dists.push(totalDist);
    }

    const stepDist = totalDist / (numPoints - 1);
    const interpolated: Location[] = [rawGeometry[0]];

    let currentSegment = 0;
    for (let i = 1; i < numPoints - 1; i++) {
      const targetDist = i * stepDist;

      // Find the segment containing targetDist
      while (currentSegment < rawGeometry.length - 2 && dists[currentSegment + 1] < targetDist) {
        currentSegment++;
      }

      const d1 = dists[currentSegment];
      const d2 = dists[currentSegment + 1];
      const p1 = rawGeometry[currentSegment];
      const p2 = rawGeometry[currentSegment + 1];

      const fraction = d2 === d1 ? 0 : (targetDist - d1) / (d2 - d1);

      interpolated.push({
        lat: p1.lat + (p2.lat - p1.lat) * fraction,
        lng: p1.lng + (p2.lng - p1.lng) * fraction
      });
    }

    interpolated.push(rawGeometry[rawGeometry.length - 1]);
    return interpolated;
  }
}

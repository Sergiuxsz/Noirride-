import { GEOFENCE_CONFIG } from '../config/geofence';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  lat: number;
  lng: number;
  formattedAddress: string;
}

const getApiKey = () => {
  const key = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.error('VITE_GOOGLE_PLACES_API_KEY is not defined in the environment variables.');
  }
  return key;
};

export const fetchPlacesAutocomplete = async (input: string): Promise<PlacePrediction[]> => {
  if (!input) return [];
  
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = 'https://places.googleapis.com/v1/places:autocomplete';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Places Autocomplete API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.suggestions) return [];

    return data.suggestions.map((suggestion: any) => {
      const placePrediction = suggestion.placePrediction;
      return {
        placeId: placePrediction.placeId,
        description: placePrediction.text.text,
        mainText: placePrediction.structuredFormat?.mainText?.text || placePrediction.text.text,
        secondaryText: placePrediction.structuredFormat?.secondaryText?.text || '',
      };
    });
  } catch (error) {
    console.error('Error fetching places autocomplete:', error);
    return [];
  }
};

export const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  // We request location and formattedAddress fields
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'location,formattedAddress',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.location) {
      return {
        lat: data.location.latitude,
        lng: data.location.longitude,
        formattedAddress: data.formattedAddress,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY || getApiKey();
  
  if (!apiKey) {
    console.error('No Google Maps API key found for reverse geocoding');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      console.warn('Google Geocoding API returned status:', data.status);
    }
  } catch (error) {
    console.error('Error with Google reverse geocoding:', error);
  }

  return null;
};

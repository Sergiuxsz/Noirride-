import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { fetchPlacesAutocomplete, fetchPlaceDetails, PlacePrediction, PlaceDetails } from '../services/googlePlaces';

const RECENT_SEARCHES_KEY = 'noirride_recent_searches';
const FAVORITES_KEY = 'noirride_favorites';

export interface SavedLocation {
  id: string; // Either a placeId or a custom ID for favorites
  label: string; // E.g., 'Home', 'Work', or the address string
  address: string;
  lat?: number;
  lng?: number;
  isFavorite?: boolean;
  type?: 'home' | 'work' | 'other';
}

export const usePlacesAutocomplete = (initialInput: string = '') => {
  const [input, setInput] = useState(initialInput);
  const debouncedInput = useDebounce(input, 400); // 400ms debounce
  
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recentSearches, setRecentSearches] = useState<SavedLocation[]>([]);
  const [favorites, setFavorites] = useState<SavedLocation[]>([]);

  // Load local storage on mount
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (storedRecent) {
        setRecentSearches(JSON.parse(storedRecent));
      }

      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      } else {
        // Default favorites to prompt the user
        const defaultFavorites: SavedLocation[] = [
          { id: 'fav_home', label: 'Home', address: 'Add Home', isFavorite: true, type: 'home' },
          { id: 'fav_work', label: 'Work', address: 'Add Work', isFavorite: true, type: 'work' }
        ];
        setFavorites(defaultFavorites);
      }
    } catch (e) {
      console.error('Error loading location history from local storage', e);
    }
  }, []);

  // Fetch predictions when debounced input changes
  useEffect(() => {
    if (!debouncedInput || debouncedInput.trim() === '') {
      setPredictions([]);
      return;
    }

    let isMounted = true;
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchPlacesAutocomplete(debouncedInput);
        if (isMounted) {
          setPredictions(results);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch predictions.');
          setPredictions([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPredictions();

    return () => {
      isMounted = false;
    };
  }, [debouncedInput]);

  const saveRecentSearch = (location: SavedLocation) => {
    // Only save valid locations, and don't duplicate
    const updated = [location, ...recentSearches.filter(r => r.id !== location.id)].slice(0, 5); // Keep last 5
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving recent search', e);
    }
  };

  const getPlaceCoordinates = async (placeId: string): Promise<PlaceDetails | null> => {
    return await fetchPlaceDetails(placeId);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }

  return {
    input,
    setInput,
    predictions,
    loading,
    error,
    recentSearches,
    favorites,
    saveRecentSearch,
    getPlaceCoordinates,
    clearRecentSearches
  };
};

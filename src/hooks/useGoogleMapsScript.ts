import { useState, useEffect } from 'react';

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

export const useGoogleMapsScript = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if map constructor exists, which means the API is fully loaded
    if (window.google?.maps?.Map) {
      setIsLoaded(true);
      return;
    }

    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.Map) {
          setIsLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_JS_API_KEY;
    if (!apiKey) {
      setError(new Error('Google Maps API Key not found'));
      return;
    }

    // Define the global callback function required by loading=async
    (window as any).__googleMapsCallback = () => {
      setIsLoaded(true);
    };

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;

    script.onerror = () => setError(new Error('Failed to load Google Maps script'));

    document.head.appendChild(script);
  }, []);

  return { isLoaded, error };
};

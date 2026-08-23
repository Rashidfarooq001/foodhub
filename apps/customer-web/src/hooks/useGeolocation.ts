import { useState, useCallback } from 'react';
import { BrowserLocationService, GeoLocationResult, ReverseGeocodeResult } from '../services/browser-location';

export type GeolocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'error';

export interface UseGeolocationResult {
  status: GeolocationState;
  coordinates: GeoLocationResult | null;
  addressData: ReverseGeocodeResult | null;
  error: string | null;
  requestLocation: () => Promise<{ coords: GeoLocationResult, address: ReverseGeocodeResult } | null>;
  reset: () => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [status, setStatus] = useState<GeolocationState>('idle');
  const [coordinates, setCoordinates] = useState<GeoLocationResult | null>(null);
  const [addressData, setAddressData] = useState<ReverseGeocodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setCoordinates(null);
    setAddressData(null);
    setError(null);
  }, []);

  const requestLocation = useCallback(async () => {
    try {
      setStatus('requesting');
      setError(null);

      const coords = await BrowserLocationService.getCurrentLocation();
      
      if (coords.accuracy > 2000) {
        console.warn('[Location] Accuracy is very poor');
      }

      setCoordinates(coords);
      setStatus('granted');

      const address = await BrowserLocationService.reverseGeocode(coords.latitude, coords.longitude);
      setAddressData(address);

      return { coords, address };
    } catch (err: any) {
      console.error(err);
      
      const errMsg = err.message || 'Unknown error occurred';
      setError(errMsg);

      if (errMsg.includes('denied')) {
        setStatus('denied');
      } else if (errMsg.includes('timeout')) {
        setStatus('timeout');
      } else if (errMsg.includes('unavailable') || errMsg.includes('HTTPS')) {
        setStatus('unavailable');
      } else {
        setStatus('error');
      }

      return null;
    }
  }, []);

  return { status, coordinates, addressData, error, requestLocation, reset };
}

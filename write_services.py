import io

browser_loc = '''import { getApiBaseUrl } from '@foodhub/config';

const API_BASE = getApiBaseUrl();

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ReverseGeocodeResult {
  formattedAddress?: string;
  locality?: string;
  district?: string;
  state?: string;
  country?: string;
  address?: string;
  displayName?: string;
}

export class BrowserLocationService {
  /**
   * Check if the environment is secure (HTTPS or localhost).
   * Geolocation API requires a secure context in modern browsers.
   */
  static isSecureContext(): boolean {
    if (typeof window === 'undefined') return true;
    return window.isSecureContext;
  }

  /**
   * Check the current permission state without triggering the prompt.
   */
  static async checkPermission(): Promise<PermissionState | 'unsupported'> {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'unsupported';
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state; // 'granted', 'prompt', 'denied'
    } catch (e) {
      return 'unsupported';
    }
  }

  /**
   * Fetch the physical GPS location using the browser's Geolocation API.
   * Prompts the user if permission hasn't been granted yet.
   */
  static getCurrentLocation(timeoutMs = 15000): Promise<GeoLocationResult> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser.'));
      }

      if (!this.isSecureContext()) {
        console.error('[Location] insecure context (HTTPS required)');
        return reject(new Error('Geolocation requires a secure connection (HTTPS).'));
      }

      console.log('[Location] Request started');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[Location] GPS success');
          console.log([Location] latitude: );
          console.log([Location] longitude: );
          console.log([Location] accuracy:  meters);
          
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission was denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is currently unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get your location timed out. Please try again.';
              break;
          }
          console.error([Location] GPS error: );
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0, // Force fresh location
        }
      );
    });
  }

  /**
   * Reverse geocode coordinates via the backend to get a human-readable address.
   */
  static async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    console.log('[Location] Reverse geocoding started');
    try {
      const url = ${API_BASE}/geolocation/reverse-geocode?lat=&lng=;
      const finalUrl = url.replace('/customer/geolocation', '/geolocation');
      const res = await fetch(finalUrl);
      
      if (!res.ok) {
        throw new Error('Reverse geocoding failed on backend');
      }
      
      const data = await res.json();
      console.log('[Location] Address resolved:', data);
      return data;
    } catch (e) {
      console.error('[Location] Reverse geocode error:', e);
      throw e;
    }
  }
}
'''

with io.open('apps/customer-web/src/services/browser-location.ts', 'w', encoding='utf-8') as f:
    f.write(browser_loc)

use_geo = '''import { useState, useCallback } from 'react';
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

      // 1. Fetch physical coordinates
      const coords = await BrowserLocationService.getCurrentLocation();
      
      // We have coordinates, but need to check accuracy
      if (coords.accuracy > 2000) {
        console.warn([Location] Accuracy is very poor (m));
        // We still proceed, but the caller might want to warn the user
      }

      setCoordinates(coords);
      setStatus('granted');

      // 2. Reverse geocode them
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

  return {
    status,
    coordinates,
    addressData,
    error,
    requestLocation,
    reset,
  };
}
'''

with io.open('apps/customer-web/src/hooks/useGeolocation.ts', 'w', encoding='utf-8') as f:
    f.write(use_geo)

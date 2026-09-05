
export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ReverseGeocodeResult {
  formattedAddress?: string;
  locality?: string;
  village?: string;
  subLocality?: string;
  subDistrict?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  postalCode?: string;
  mapplsPin?: string;
  street?: string;
  houseNumber?: string;
  address?: string;
  displayName?: string;
  latitude?: number;
  longitude?: number;
}

export class BrowserLocationService {
  static isSecureContext(): boolean {
    if (typeof window === 'undefined') return true;
    return window.isSecureContext;
  }

  static async checkPermission(): Promise<PermissionState | 'unsupported'> {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return 'unsupported';
    }
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });
      return status.state;
    } catch (e) {
      return 'unsupported';
    }
  }

  static getCurrentLocation(timeoutMs = 15000): Promise<GeoLocationResult> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser.'));
      }

      if (!this.isSecureContext()) {
        return reject(new Error('Geolocation requires a secure connection (HTTPS).'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
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
              errorMessage =
                'Location permission was denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is currently unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get your location timed out. Please try again.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 0,
        },
      );
    });
  }

  static async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    try {
      // Use the Next.js reverse-geocode proxy route which is always available
      // at /api/geo/reverse regardless of backend URL configuration.
      const res = await fetch(`/api/geo/reverse?lat=${lat}&lng=${lng}`);
      if (!res.ok) {
        console.warn('[BrowserLocationService] reverseGeocode failed with status', res.status);
        return {};
      }
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('[BrowserLocationService] reverseGeocode error:', e);
      // Return an empty object — callers handle missing fields gracefully
      // by falling back to 'Current Location' label. Never throw here.
      return {};
    }
  }
}

import { apiClient } from './axios-client';
import { getRequest } from './helpers';

export interface GeolocationSuggestion {
  id: string;
  placeName: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
}

export interface GeolocationAutosuggestResponse {
  suggestions: GeolocationSuggestion[];
}

export async function fetchLocationAutosuggest(
  query: string,
  signal?: AbortSignal,
): Promise<GeolocationSuggestion[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }
  try {
    const res = await getRequest<GeolocationAutosuggestResponse | GeolocationSuggestion[]>(
      apiClient,
      `/geolocation/autosuggest?q=${encodeURIComponent(query.trim())}&query=${encodeURIComponent(query.trim())}`,
      { signal },
    );
    if (Array.isArray(res)) {
      return res.map((item: any) => ({
        id: item.id || item.placeId || `loc-${Math.random()}`,
        placeName: item.placeName || item.displayName?.split(',')[0] || query,
        address: item.address || item.displayName || query,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        latitude: parseFloat(item.latitude ?? item.lat ?? 0),
        longitude: parseFloat(item.longitude ?? item.lng ?? 0),
      }));
    }
    return res?.suggestions || [];
  } catch (err: any) {
    if (err.name === 'CanceledError' || err.name === 'AbortError') {
      return [];
    }
    console.error('[API_CLIENT] Geolocation autosuggest fetch error:', err);
    return [];
  }
}

export interface ForwardGeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  displayName?: string;
  message?: string;
}

export async function forwardGeocodeAddress(
  addressQuery: string,
  signal?: AbortSignal,
): Promise<ForwardGeocodeResponse> {
  const clean = addressQuery?.trim();
  if (!clean) {
    return { success: false, message: 'Address query is required' };
  }
  try {
    const res = await getRequest<ForwardGeocodeResponse>(
      apiClient,
      `/geolocation/geocode?address=${encodeURIComponent(clean)}`,
      { signal },
    );
    if (res?.success && typeof res.latitude === 'number' && typeof res.longitude === 'number') {
      return {
        success: true,
        latitude: res.latitude,
        longitude: res.longitude,
        displayName: res.displayName,
      };
    }
    return {
      success: false,
      message: res?.message || "Couldn't determine the location of this address. Please check your address details and try again.",
    };
  } catch (err: any) {
    console.error('[API_CLIENT] Forward geocode error:', err);
    return {
      success: false,
      message: "Couldn't determine the location of this address. Please check your address details and try again.",
    };
  }
}

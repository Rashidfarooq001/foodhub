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

export interface PlaceSearchResultItem {
  placeId: string;
  placeName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  state?: string;
  confidence: number;
}

export async function searchPlacesByName(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSearchResultItem[]> {
  const clean = query?.trim();
  if (!clean) return [];
  try {
    const res = await getRequest<{ places?: PlaceSearchResultItem[] } | PlaceSearchResultItem[]>(
      apiClient,
      `/geolocation/search-place?q=${encodeURIComponent(clean)}&query=${encodeURIComponent(clean)}`,
      { signal },
    );
    if (Array.isArray(res)) return res;
    return res?.places || [];
  } catch (err: any) {
    console.error('[API_CLIENT] Search places by name error:', err);
    return [];
  }
}

export interface ForwardGeocodeResponse {
  success: boolean;
  latitude?: number;
  longitude?: number;
  displayName?: string;
  geocodeLevel?: string;
  precisionLabel?: 'EXACT' | 'AREA' | 'PINCODE' | 'UNKNOWN';
  confidenceScore?: number | null;
  queryTierUsed?: number;
  message?: string;
}

export interface StructuredAddressPayload {
  houseNumber?: string;
  street?: string;
  areaLocality?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address?: string;
}

export async function forwardGeocodeStructuredAddress(
  payload: StructuredAddressPayload,
  signal?: AbortSignal,
): Promise<ForwardGeocodeResponse> {
  try {
    const res = await apiClient.post<ForwardGeocodeResponse>(
      '/geolocation/forward-geocode',
      payload,
      { signal },
    );
    const data: any = res.data;
    const lat = typeof data?.latitude === 'number' ? data.latitude : data?.location?.latitude;
    const lng = typeof data?.longitude === 'number' ? data.longitude : data?.location?.longitude;

    if (data?.success && typeof lat === 'number' && typeof lng === 'number') {
      return {
        ...data,
        latitude: lat,
        longitude: lng,
      };
    }
    return {
      success: false,
      message: data?.message || "Couldn't determine the location of this address. Please check your address details and try again.",
    };
  } catch (err: any) {
    // Fallback to GET endpoint
    const query = [
      payload.houseNumber,
      payload.areaLocality || payload.address,
      payload.landmark,
      payload.city,
      payload.state,
      payload.postalCode,
    ].filter(Boolean).join(', ');

    return forwardGeocodeAddress(query, signal);
  }
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
        geocodeLevel: res.geocodeLevel,
        precisionLabel: res.precisionLabel,
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

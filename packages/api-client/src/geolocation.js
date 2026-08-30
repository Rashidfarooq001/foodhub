import { apiClient } from './axios-client.js';
import { getRequest } from './helpers.js';
export async function fetchLocationAutosuggest(query, signal) {
    if (!query || query.trim().length < 1) {
        return [];
    }
    try {
        const res = await getRequest(apiClient, `/geolocation/autosuggest?q=${encodeURIComponent(query.trim())}&query=${encodeURIComponent(query.trim())}`, { signal });
        if (Array.isArray(res)) {
            return res.map((item) => ({
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
    }
    catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
            return [];
        }
        console.error('[API_CLIENT] Geolocation autosuggest fetch error:', err);
        return [];
    }
}
export async function searchPlacesByName(query, signal) {
    const clean = query?.trim();
    if (!clean)
        return [];
    try {
        const res = await getRequest(apiClient, `/geolocation/search-place?q=${encodeURIComponent(clean)}&query=${encodeURIComponent(clean)}`, { signal });
        if (Array.isArray(res))
            return res;
        return res?.places || [];
    }
    catch (err) {
        console.error('[API_CLIENT] Search places by name error:', err);
        return [];
    }
}
export async function forwardGeocodeStructuredAddress(payload, signal) {
    try {
        const res = await apiClient.post('/location/resolve', payload, { signal });
        const data = res.data;
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
    }
    catch (err) {
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
export async function forwardGeocodeAddress(addressQuery, signal) {
    const clean = addressQuery?.trim();
    if (!clean) {
        return { success: false, message: 'Address query is required' };
    }
    try {
        const res = await getRequest(apiClient, `/geolocation/geocode?address=${encodeURIComponent(clean)}`, { signal });
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
    }
    catch (err) {
        console.error('[API_CLIENT] Forward geocode error:', err);
        return {
            success: false,
            message: "Couldn't determine the location of this address. Please check your address details and try again.",
        };
    }
}

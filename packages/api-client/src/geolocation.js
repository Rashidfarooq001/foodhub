"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLocationAutosuggest = fetchLocationAutosuggest;
exports.forwardGeocodeStructuredAddress = forwardGeocodeStructuredAddress;
exports.forwardGeocodeAddress = forwardGeocodeAddress;
const axios_client_1 = require("./axios-client");
const helpers_1 = require("./helpers");
async function fetchLocationAutosuggest(query, signal) {
    if (!query || query.trim().length < 1) {
        return [];
    }
    try {
        const res = await (0, helpers_1.getRequest)(axios_client_1.apiClient, `/geolocation/autosuggest?q=${encodeURIComponent(query.trim())}&query=${encodeURIComponent(query.trim())}`, { signal });
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
async function forwardGeocodeStructuredAddress(payload, signal) {
    try {
        const res = await axios_client_1.apiClient.post('/geolocation/geocode', payload, { signal });
        if (res.data?.success && typeof res.data.latitude === 'number' && typeof res.data.longitude === 'number') {
            return res.data;
        }
        return {
            success: false,
            message: res.data?.message || "Couldn't determine the location of this address. Please check your address details and try again.",
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
async function forwardGeocodeAddress(addressQuery, signal) {
    const clean = addressQuery?.trim();
    if (!clean) {
        return { success: false, message: 'Address query is required' };
    }
    try {
        const res = await (0, helpers_1.getRequest)(axios_client_1.apiClient, `/geolocation/geocode?address=${encodeURIComponent(clean)}`, { signal });
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

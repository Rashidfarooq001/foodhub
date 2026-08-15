"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLocationAutosuggest = fetchLocationAutosuggest;
const axios_client_1 = require("./axios-client");
const helpers_1 = require("./helpers");
async function fetchLocationAutosuggest(query, signal) {
    if (!query || query.trim().length < 2) {
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

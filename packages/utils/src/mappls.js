/**
 * Validates latitude and longitude strictly within geographic boundaries.
 * Rejects NaN, Infinity, null, undefined, or out-of-range values.
 */
export function validateCoordinates(lat, lng) {
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
        return false;
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false;
    }
    if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
        return false;
    }
    if (lat === 0 && lng === 0) {
        return false;
    }
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
/**
 * Searches Mappls Autocomplete API for address suggestions given a partial query.
 * Calls backend API or direct Mappls REST endpoint safely.
 */
export function getMapplsSearchEndpoint(apiBaseUrl) {
    const base = apiBaseUrl ||
        process.env.NEXT_PUBLIC_API_URL ||
        `http://localhost:${process.env.PORT || 4000}/api/v1`;
    return `${base.replace(/\/+$/, '')}/geolocation/search`;
}
export function getMapplsReverseGeocodeEndpoint(apiBaseUrl) {
    const base = apiBaseUrl ||
        process.env.NEXT_PUBLIC_API_URL ||
        `http://localhost:${process.env.PORT || 4000}/api/v1`;
    return `${base.replace(/\/+$/, '')}/geolocation/reverse-geocode`;
}

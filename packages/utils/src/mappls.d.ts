export interface MapplsPlaceSuggestion {
    placeId: string;
    placeName: string;
    placeAddress: string;
    latitude: number | null;
    longitude: number | null;
    city?: string;
    state?: string;
    pincode?: string;
}
export interface MapplsGeocodeResult {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    placeId?: string;
}
/**
 * Validates latitude and longitude strictly within geographic boundaries.
 * Rejects NaN, Infinity, null, undefined, or out-of-range values.
 */
export declare function validateCoordinates(lat?: number | null, lng?: number | null): boolean;
/**
 * Searches Mappls Autocomplete API for address suggestions given a partial query.
 * Calls backend API or direct Mappls REST endpoint safely.
 */
export declare function getMapplsSearchEndpoint(apiBaseUrl?: string): string;
export declare function getMapplsReverseGeocodeEndpoint(apiBaseUrl?: string): string;

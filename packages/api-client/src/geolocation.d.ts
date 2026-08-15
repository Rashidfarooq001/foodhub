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
export declare function fetchLocationAutosuggest(query: string, signal?: AbortSignal): Promise<GeolocationSuggestion[]>;
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
export declare function forwardGeocodeStructuredAddress(payload: StructuredAddressPayload, signal?: AbortSignal): Promise<ForwardGeocodeResponse>;
export declare function forwardGeocodeAddress(addressQuery: string, signal?: AbortSignal): Promise<ForwardGeocodeResponse>;

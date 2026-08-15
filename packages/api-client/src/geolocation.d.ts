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
    message?: string;
}
export declare function forwardGeocodeAddress(addressQuery: string, signal?: AbortSignal): Promise<ForwardGeocodeResponse>;

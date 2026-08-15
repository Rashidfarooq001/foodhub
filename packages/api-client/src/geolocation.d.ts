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

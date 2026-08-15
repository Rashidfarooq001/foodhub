export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
}

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

/**
 * Shared API & WebSocket Configuration Module for FoodHub
 * Reads NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL from environment variables.
 * Guarantees that getApiBaseUrl() includes the '/api/v1' path prefix exactly once.
 */
export declare function getApiBaseUrl(): string;
export declare function getWsBaseUrl(): string;
export declare const API_CONFIG: {
    readonly baseUrl: string;
    readonly wsUrl: string;
};

/**
 * Shared API & WebSocket Configuration Module for FoodHub
 * Reads NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL from environment variables.
 * Guarantees that getApiBaseUrl() includes the '/api/v1' path prefix exactly once.
 */
export declare function getApiBaseUrl(): string;
export declare function getWsBaseUrl(): string;
/**
 * Resolves media/image URLs consistently across localhost and production environments.
 * Handles relative paths (/uploads/file.jpg), full URLs, base64 data URLs,
 * and localhost URLs accessed from production environments.
 */
export declare function getImageUrl(url?: string | null): string;
export declare function getHotelDashboardUrl(): string;
export declare function getDeliveryDashboardUrl(): string;
export declare function getAdminDashboardUrl(): string;
export declare const API_CONFIG: {
    readonly baseUrl: string;
    readonly wsUrl: string;
    readonly hotelDashboardUrl: string;
    readonly deliveryDashboardUrl: string;
    readonly adminDashboardUrl: string;
};

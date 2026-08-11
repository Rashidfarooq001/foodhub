"use strict";
/**
 * Shared API & WebSocket Configuration Module for FoodHub
 * Reads NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL from environment variables.
 * Guarantees that getApiBaseUrl() includes the '/api/v1' path prefix exactly once.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_CONFIG = void 0;
exports.getApiBaseUrl = getApiBaseUrl;
exports.getWsBaseUrl = getWsBaseUrl;
exports.getImageUrl = getImageUrl;
exports.getHotelDashboardUrl = getHotelDashboardUrl;
exports.getDeliveryDashboardUrl = getDeliveryDashboardUrl;
exports.getAdminDashboardUrl = getAdminDashboardUrl;
function getApiBaseUrl() {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL;
    let url;
    if (envUrl) {
        url = envUrl.trim().replace(/\/+$/, '');
    }
    else if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        url = 'http://localhost:4000/api/v1';
    }
    else {
        url = 'https://foodhub-backend-enq2.onrender.com/api/v1';
    }
    // Collapse any repeated /api/v1 suffixes in env var settings down to a single /api/v1
    url = url.replace(/(\/api\/v1)+$/g, '/api/v1');
    // Ensure base URL ends with /api/v1 exactly once
    if (!url.endsWith('/api/v1')) {
        url = `${url}/api/v1`;
    }
    return url;
}
function getWsBaseUrl() {
    const envWsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.PUBLIC_WS_URL;
    if (envWsUrl) {
        return envWsUrl.trim().replace(/\/+$/, '');
    }
    const apiBase = getApiBaseUrl();
    return apiBase.replace(/^http/, 'ws');
}
/**
 * Resolves media/image URLs consistently across localhost and production environments.
 * Handles relative paths (/uploads/file.jpg), full URLs, base64 data URLs,
 * and localhost URLs accessed from production environments.
 */
function getImageUrl(url) {
    const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
    if (!url || typeof url !== 'string' || !url.trim()) {
        return fallback;
    }
    const cleanUrl = url.trim();
    // Data URLs or blob URLs pass through as-is
    if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
        return cleanUrl;
    }
    // Get API Server Base Origin (e.g. "http://localhost:4000" or "https://foodhub-backend-enq2.onrender.com")
    const apiBase = getApiBaseUrl();
    const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    // Handle any upload URL (localhost or production domain) when running in local development environment
    if (cleanUrl.includes('/uploads/')) {
        if (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            const match = cleanUrl.match(/\/uploads\/(.+)$/);
            if (match && match[1]) {
                return `${serverOrigin}/uploads/${match[1]}`;
            }
        }
    }
    // Handle localhost:4000 URL when app is running in remote production environment (e.g. on Vercel)
    if (cleanUrl.includes('localhost:4000') || cleanUrl.includes('127.0.0.1:4000')) {
        if (typeof window !== 'undefined' &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1') {
            return cleanUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):4000/, serverOrigin);
        }
    }
    // Handle relative upload paths e.g. "/uploads/filename.jpg" or "uploads/filename.jpg"
    if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
        const path = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
        return `${serverOrigin}${path}`;
    }
    // Handle full HTTP / HTTPS URLs
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return cleanUrl;
    }
    // Fallback relative path
    return `${serverOrigin}/${cleanUrl.replace(/^\/+/, '')}`;
}
function getHotelDashboardUrl() {
    const envUrl = process.env.NEXT_PUBLIC_HOTEL_DASHBOARD_URL;
    if (envUrl && envUrl.trim())
        return envUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3001';
    }
    return 'https://foodhub-hotel-dashboard.vercel.app';
}
function getDeliveryDashboardUrl() {
    const envUrl = process.env.NEXT_PUBLIC_DELIVERY_DASHBOARD_URL;
    if (envUrl && envUrl.trim())
        return envUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3002';
    }
    return 'https://foodhub-delivery-dashboard.vercel.app';
}
function getAdminDashboardUrl() {
    const envUrl = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_URL;
    if (envUrl && envUrl.trim())
        return envUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3003';
    }
    return 'https://foodhub-admin-dashboard.vercel.app';
}
exports.API_CONFIG = {
    get baseUrl() {
        return getApiBaseUrl();
    },
    get wsUrl() {
        return getWsBaseUrl();
    },
    get hotelDashboardUrl() {
        return getHotelDashboardUrl();
    },
    get deliveryDashboardUrl() {
        return getDeliveryDashboardUrl();
    },
    get adminDashboardUrl() {
        return getAdminDashboardUrl();
    },
};

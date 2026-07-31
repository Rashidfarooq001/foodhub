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
exports.API_CONFIG = {
    get baseUrl() {
        return getApiBaseUrl();
    },
    get wsUrl() {
        return getWsBaseUrl();
    },
};

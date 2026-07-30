/**
 * Shared API & WebSocket Configuration Module for FoodHub
 * Reads NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL from environment variables.
 * Guarantees that getApiBaseUrl() includes the '/api/v1' path prefix exactly once.
 */

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL;

  let url: string;
  if (!envUrl) {
    url = 'https://foodhub-backend-enq2.onrender.com/api/v1';
  } else {
    url = envUrl.trim().replace(/\/+$/, '');
  }

  // Collapse any repeated /api/v1 suffixes in env var settings down to a single /api/v1
  url = url.replace(/(\/api\/v1)+$/g, '/api/v1');

  // Ensure base URL ends with /api/v1 exactly once
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }

  return url;
}

export function getWsBaseUrl(): string {
  const envWsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.PUBLIC_WS_URL;

  if (envWsUrl) {
    return envWsUrl.trim().replace(/\/+$/, '');
  }

  const apiBase = getApiBaseUrl();
  return apiBase.replace(/^http/, 'ws');
}

export const API_CONFIG = {
  get baseUrl(): string {
    return getApiBaseUrl();
  },
  get wsUrl(): string {
    return getWsBaseUrl();
  },
};

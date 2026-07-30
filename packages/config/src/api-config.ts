/**
 * Shared API & WebSocket Configuration Module for FoodHub
 * Reads NEXT_PUBLIC_API_URL and NEXT_PUBLIC_WS_URL from environment variables.
 * Fails with a clear, descriptive error if required environment variables are missing at client runtime.
 */

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.PUBLIC_API_URL;

  if (!envUrl) {
    if (typeof window !== 'undefined') {
      console.error(
        '[FoodHub Config Error] NEXT_PUBLIC_API_URL environment variable is missing.',
      );
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: NEXT_PUBLIC_API_URL environment variable is missing. Please configure NEXT_PUBLIC_API_URL in your environment settings.',
      );
    }
    // Return standard fallback during Next.js SSG / static prerendering build phase
    return 'http://localhost:4000';
  }

  return envUrl.replace(/\/+$/, '');
}

export function getWsBaseUrl(): string {
  const envWsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.PUBLIC_WS_URL;

  if (envWsUrl) {
    return envWsUrl.replace(/\/+$/, '');
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

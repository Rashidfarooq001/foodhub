import { getApiBaseUrl } from '@foodhub/config';
import { useAdminAuthStore } from '../stores/use-admin-auth-store';

const getApiBase = () =>
  typeof window !== 'undefined'
    ? getApiBaseUrl()
    : 'https://foodhub-backend-enq2.onrender.com/api/v1';

export function getAdminAccessToken(): string | null {
  // 1. Get from Zustand memory store
  const storeToken = useAdminAuthStore.getState().accessToken;
  if (storeToken) return storeToken;

  // 2. Fallback to persisted Zustand localStorage
  if (typeof window !== 'undefined') {
    try {
      const persisted = localStorage.getItem('foodhub-admin-auth');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed?.state?.accessToken) {
          return parsed.state.accessToken;
        }
      }
      const legacyToken = localStorage.getItem('foodhub_admin_token');
      if (legacyToken) return legacyToken;
    } catch {
      /* ignore */
    }
  }

  return null;
}

export async function adminFetch(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<Response> {
  const token = getAdminAccessToken();

  if (requireAuth && !token && typeof window !== 'undefined') {
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  const baseUrl = getApiBase();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${path}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && requireAuth) {
    useAdminAuthStore.getState().logout();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  return response;
}

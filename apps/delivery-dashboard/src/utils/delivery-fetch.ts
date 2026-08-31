import { getApiBaseUrl } from '@foodhub/config';
import { useDeliveryAuthStore } from '../stores/use-delivery-auth-store';

const getApiBase = () => getApiBaseUrl();

export function getDeliveryAccessToken(): string | null {
  const storeToken = useDeliveryAuthStore.getState().accessToken;
  if (storeToken) return storeToken;

  if (typeof window !== 'undefined') {
    try {
      const persisted = localStorage.getItem('foodhub-delivery-auth');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed?.state?.accessToken) {
          return parsed.state.accessToken;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

export function getDeliveryRefreshToken(): string | null {
  const storeRefreshToken = useDeliveryAuthStore.getState().refreshToken;
  if (storeRefreshToken) return storeRefreshToken;

  if (typeof window !== 'undefined') {
    try {
      const persisted = localStorage.getItem('foodhub-delivery-auth');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed?.state?.refreshToken) {
          return parsed.state.refreshToken;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function attemptRefreshToken(): Promise<string | null> {
  const refreshToken = getDeliveryRefreshToken();
  if (!refreshToken) return null;

  try {
    const baseUrl = getApiBase();
    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccessToken = data.tokens?.accessToken || data.accessToken;
      const newRefreshToken = data.tokens?.refreshToken || data.refreshToken || refreshToken;

      if (newAccessToken) {
        const currentUser = useDeliveryAuthStore.getState().user;
        if (currentUser) {
          useDeliveryAuthStore.getState().setAuth(currentUser, newAccessToken, newRefreshToken);
        }
        return newAccessToken;
      }
    }
  } catch {
    /* ignore refresh failure */
  }

  return null;
}

export async function deliveryFetch(
  endpoint: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<Response> {
  let token = getDeliveryAccessToken();

  const baseUrl = getApiBase();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${path}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const buildHeaders = (authToken: string | null) => {
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  };

  let response = await fetch(url, {
    ...options,
    headers: buildHeaders(token),
  });

  if (response.status === 401 && requireAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefreshToken();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        return fetch(url, {
          ...options,
          headers: buildHeaders(newToken),
        });
      } else {
        useDeliveryAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
    } else {
      return new Promise<Response>((resolve) => {
        refreshSubscribers.push((newToken) => {
          resolve(
            fetch(url, {
              ...options,
              headers: buildHeaders(newToken),
            }),
          );
        });
      });
    }
  }

  return response;
}

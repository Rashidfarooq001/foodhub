import { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { TokenManager } from './token-manager.js';

export function setupInterceptors(client: AxiosInstance): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = TokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        TokenManager.clearTokens();
      }
      return Promise.reject(error);
    },
  );
}

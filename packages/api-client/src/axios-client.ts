import axios, { AxiosInstance } from 'axios';
import { setupInterceptors } from './interceptors.js';
import { getApiBaseUrl } from '@foodhub/config';

export function createApiClient(baseURL?: string): AxiosInstance {
  const base = baseURL ? baseURL.replace(/\/+$/, '') : getApiBaseUrl();
  const client = axios.create({
    baseURL: base,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  setupInterceptors(client);
  return client;
}

export const apiClient = createApiClient();

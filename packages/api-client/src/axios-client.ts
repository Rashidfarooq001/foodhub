import axios, { AxiosInstance } from 'axios';
import { setupInterceptors } from './interceptors';

export function createApiClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  setupInterceptors(client);
  return client;
}

export const apiClient = createApiClient();

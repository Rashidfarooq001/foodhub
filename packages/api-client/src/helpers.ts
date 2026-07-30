import { AxiosInstance, AxiosRequestConfig } from 'axios';

export async function getRequest<T>(
  client: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.get<T>(url, config);
  return response.data;
}

export async function postRequest<T>(
  client: AxiosInstance,
  url: string,
  data?: any,
  config?: AxiosRequestConfig,
): Promise<T> {
  const response = await client.post<T>(url, data, config);
  return response.data;
}

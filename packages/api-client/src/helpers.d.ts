import { AxiosInstance, AxiosRequestConfig } from 'axios';
export declare function getRequest<T>(client: AxiosInstance, url: string, config?: AxiosRequestConfig): Promise<T>;
export declare function postRequest<T>(client: AxiosInstance, url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;

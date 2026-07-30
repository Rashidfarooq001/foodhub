import { AxiosError } from 'axios';

export interface StandardApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export function handleApiError(error: unknown): StandardApiError {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<StandardApiError>;
    if (axiosError.response?.data) {
      return {
        message: axiosError.response.data.message || 'An unexpected error occurred',
        statusCode: axiosError.response.status,
        error: axiosError.response.data.error,
      };
    }
  }

  return {
    message: error instanceof Error ? error.message : 'Network error or service unavailable',
    statusCode: 500,
  };
}

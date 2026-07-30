"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = handleApiError;
function handleApiError(error) {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error;
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

export interface StandardApiError {
    message: string;
    statusCode: number;
    error?: string;
}
export declare function handleApiError(error: unknown): StandardApiError;

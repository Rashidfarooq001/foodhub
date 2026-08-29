export interface UseSessionTimeoutOptions {
    portalName: 'customer' | 'hotel' | 'delivery' | 'admin';
    isAuthenticated: boolean;
    accessToken: string | null;
    logout: () => void;
    apiBaseUrl: string;
    loginPath?: string;
    timeoutMs?: number;
    isProtectedPath?: (pathname: string) => boolean;
}
export declare function useSessionTimeout({ portalName, isAuthenticated, accessToken, logout, apiBaseUrl, loginPath, timeoutMs, isProtectedPath, }: UseSessionTimeoutOptions): {
    performAutoLogout: () => Promise<void>;
};

export declare const TokenManager: {
    getAccessToken: () => string | null;
    setAccessToken: (token: string) => void;
    getRefreshToken: () => string | null;
    setRefreshToken: (token: string) => void;
    clearTokens: () => void;
};

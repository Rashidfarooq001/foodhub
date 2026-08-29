"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenManager = void 0;
const TOKEN_KEY = 'foodhub_access_token';
const REFRESH_TOKEN_KEY = 'foodhub_refresh_token';
exports.TokenManager = {
    getAccessToken: () => {
        if (typeof window === 'undefined')
            return null;
        return localStorage.getItem(TOKEN_KEY);
    },
    setAccessToken: (token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },
    getRefreshToken: () => {
        if (typeof window === 'undefined')
            return null;
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },
    setRefreshToken: (token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(REFRESH_TOKEN_KEY, token);
        }
    },
    clearTokens: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    },
};

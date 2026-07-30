"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupInterceptors = setupInterceptors;
const token_manager_1 = require("./token-manager");
function setupInterceptors(client) {
    client.interceptors.request.use((config) => {
        const token = token_manager_1.TokenManager.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => Promise.reject(error));
    client.interceptors.response.use((response) => response, async (error) => {
        if (error.response?.status === 401) {
            token_manager_1.TokenManager.clearTokens();
        }
        return Promise.reject(error);
    });
}

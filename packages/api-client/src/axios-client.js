"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
exports.createApiClient = createApiClient;
const axios_1 = __importDefault(require("axios"));
const interceptors_1 = require("./interceptors");
const config_1 = require("@foodhub/config");
function createApiClient(baseURL) {
    const base = baseURL || `${(0, config_1.getApiBaseUrl)()}/api/v1`;
    const client = axios_1.default.create({
        baseURL: base,
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    (0, interceptors_1.setupInterceptors)(client);
    return client;
}
exports.apiClient = createApiClient();

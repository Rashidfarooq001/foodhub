"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
exports.createApiClient = createApiClient;
const axios_1 = __importDefault(require("axios"));
const interceptors_1 = require("./interceptors");
function createApiClient(baseURL) {
    const client = axios_1.default.create({
        baseURL: baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    (0, interceptors_1.setupInterceptors)(client);
    return client;
}
exports.apiClient = createApiClient();

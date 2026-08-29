"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchOrderQuote = fetchOrderQuote;
exports.fetchActiveTaxRules = fetchActiveTaxRules;
const config_1 = require("@foodhub/config");
const API_BASE = (0, config_1.getApiBaseUrl)();
async function fetchOrderQuote(req) {
    try {
        const res = await fetch(`${API_BASE}/orders/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
        });
        if (res.ok) {
            return await res.json();
        }
        // Attempt to extract structured error from backend
        const errBody = await res.json().catch(() => ({}));
        const msg = Array.isArray(errBody.message)
            ? errBody.message.join(', ')
            : errBody.message || errBody.error || `HTTP ${res.status}`;
        throw new Error(msg);
    }
    catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Unable to connect to the delivery service.');
        }
        throw error;
    }
}
async function fetchActiveTaxRules() {
    try {
        const res = await fetch(`${API_BASE}/tax/rules`);
        if (res.ok) {
            return await res.json();
        }
    }
    catch {
        /* fallback */
    }
    return [];
}

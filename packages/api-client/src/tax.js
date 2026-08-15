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
    }
    catch {
        /* fallback */
    }
    return null;
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

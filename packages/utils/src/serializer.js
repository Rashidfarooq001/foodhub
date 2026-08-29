"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializePrisma = serializePrisma;
function serializePrisma(data) {
    if (data === null || data === undefined) {
        return data;
    }
    if (typeof data === 'object' &&
        data !== null &&
        ((data.s !== undefined && data.e !== undefined && Array.isArray(data.d)) ||
            typeof data.toNumber === 'function')) {
        return Number(data);
    }
    if (typeof data === 'bigint') {
        return Number(data);
    }
    if (data instanceof Date) {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map((item) => serializePrisma(item));
    }
    if (typeof data === 'object' && data.constructor === Object) {
        const result = {};
        for (const key of Object.keys(data)) {
            result[key] = serializePrisma(data[key]);
        }
        return result;
    }
    return data;
}

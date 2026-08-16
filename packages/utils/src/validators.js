"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeIndianPhone = normalizeIndianPhone;
exports.isValidIndianPhone = isValidIndianPhone;
exports.isValidFssai = isValidFssai;
exports.isValidGstin = isValidGstin;
function normalizeIndianPhone(input) {
    if (!input || typeof input !== 'string') {
        throw new Error('Enter a valid 10-digit Indian mobile number.');
    }
    let cleaned = input.trim().replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91')) {
        cleaned = cleaned.substring(3);
    }
    else if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.substring(2);
    }
    else if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = cleaned.substring(1);
    }
    const indianMobileRegex = /^[6-9]\d{9}$/;
    if (!indianMobileRegex.test(cleaned)) {
        throw new Error('Enter a valid 10-digit Indian mobile number.');
    }
    return `+91${cleaned}`;
}
function isValidIndianPhone(phone) {
    try {
        normalizeIndianPhone(phone);
        return true;
    }
    catch {
        return false;
    }
}
function isValidFssai(license) {
    const fssaiRegex = /^\d{14}$/;
    return fssaiRegex.test(license);
}
function isValidGstin(gstin) {
    const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
    return gstinRegex.test(gstin);
}

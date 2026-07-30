"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIndianPhone = isValidIndianPhone;
exports.isValidFssai = isValidFssai;
exports.isValidGstin = isValidGstin;
function isValidIndianPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-+]/g, '').slice(-10));
}
function isValidFssai(license) {
    const fssaiRegex = /^\d{14}$/;
    return fssaiRegex.test(license);
}
function isValidGstin(gstin) {
    const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
    return gstinRegex.test(gstin);
}

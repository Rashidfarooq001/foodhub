export function isValidIndianPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-+]/g, '').slice(-10));
}

export function isValidFssai(license: string): boolean {
  const fssaiRegex = /^\d{14}$/;
  return fssaiRegex.test(license);
}

export function isValidGstin(gstin: string): boolean {
  const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;
  return gstinRegex.test(gstin);
}

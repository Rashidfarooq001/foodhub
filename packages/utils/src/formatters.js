export function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}
export function formatPhone(phone) {
    if (phone.length === 10) {
        return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
}
export function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}
export function formatDuration(seconds) {
    const mins = Math.ceil(seconds / 60);
    return `${mins} mins`;
}

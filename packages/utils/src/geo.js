"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHaversineDistance = calculateHaversineDistance;
function calculateHaversineDistance(lat1, lon1, lat2, lon2) { throw new Error("Haversine distance is deprecated. Use Google Maps Distance Matrix / Routes API exclusively.");
    const R = 6371; // Radius of Earth in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Returns distance in KM
}


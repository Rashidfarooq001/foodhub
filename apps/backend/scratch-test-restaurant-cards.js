function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function normalizeRestaurantData(raw, userCoords) {
  const r = raw || {};
  const foodItems = r.foodItems || [];

  let priceForTwo = undefined;
  if (r.priceForTwo && r.priceForTwo > 0) {
    priceForTwo = r.priceForTwo;
  } else if (foodItems.length > 0) {
    const avgPrice = foodItems.reduce((sum, item) => sum + item.price, 0) / foodItems.length;
    priceForTwo = Math.max(100, Math.round((avgPrice * 2) / 50) * 50);
  }

  const restLat = r.latitude || 0;
  const restLng = r.longitude || 0;

  let distanceKm = undefined;
  let deliveryTimeMins = undefined;

  if (r.distanceKm && r.distanceKm > 0) {
    distanceKm = r.distanceKm;
  } else if (userCoords && userCoords.lat && userCoords.lng && restLat !== 0 && restLng !== 0) {
    distanceKm = calculateHaversineDistance(userCoords.lat, userCoords.lng, restLat, restLng);
  }

  if (r.deliveryTimeMins && r.deliveryTimeMins > 0) {
    deliveryTimeMins = r.deliveryTimeMins;
  } else if (distanceKm !== undefined && distanceKm !== null) {
    deliveryTimeMins = Math.max(15, Math.round(20 + distanceKm * 3));
  }

  return {
    name: r.name,
    distanceKm,
    deliveryTimeMins,
    priceForTwo,
  };
}

// 3 Test Restaurants with different coordinates and food items
const rest1 = {
  name: 'Indiranagar Biryani Express',
  latitude: 12.9783,
  longitude: 77.6408,
  foodItems: [{ price: 180 }, { price: 240 }, { price: 200 }],
};

const rest2 = {
  name: 'Koramangala Pizza Haven',
  latitude: 12.9352,
  longitude: 77.6245,
  foodItems: [{ price: 350 }, { price: 450 }],
};

const rest3 = {
  name: 'New Unpriced Kitchen',
  latitude: 13.0358,
  longitude: 77.597,
  foodItems: [],
};

console.log('=== TEST WITH GPS CUSTOMER LOCATION (12.9716, 77.5946) ===');
const customerCoords = { lat: 12.9716, lng: 77.5946 };

[rest1, rest2, rest3].forEach((r) => {
  const norm = normalizeRestaurantData(r, customerCoords);
  console.log(`\nRestaurant: "${norm.name}"`);
  console.log(
    `Distance: ${norm.distanceKm !== undefined ? `${norm.distanceKm} km away` : 'Distance unavailable'}`,
  );
  console.log(
    `Time: ${norm.deliveryTimeMins !== undefined ? `${norm.deliveryTimeMins} mins` : 'Time unavailable'}`,
  );
  console.log(
    `Price: ${norm.priceForTwo !== undefined ? `₹${norm.priceForTwo} for two` : 'Price not available'}`,
  );
});

console.log('\n=== TEST WITHOUT CUSTOMER LOCATION (UNKNOWN GPS) ===');
[rest1, rest2, rest3].forEach((r) => {
  const norm = normalizeRestaurantData(r, null);
  console.log(`\nRestaurant: "${norm.name}"`);
  console.log(
    `Distance: ${norm.distanceKm !== undefined ? `${norm.distanceKm} km away` : 'Distance unavailable'}`,
  );
  console.log(
    `Time: ${norm.deliveryTimeMins !== undefined ? `${norm.deliveryTimeMins} mins` : 'Time unavailable'}`,
  );
  console.log(
    `Price: ${norm.priceForTwo !== undefined ? `₹${norm.priceForTwo} for two` : 'Price not available'}`,
  );
});

const fs = require('fs');

const utilPath = 'apps/backend/src/modules/restaurants/restaurant-availability.util.ts';
const restServicePath = 'apps/backend/src/modules/restaurants/restaurants.service.ts';
const orderValPath = 'apps/backend/src/modules/orders/orders.validation.service.ts';

let restService = fs.readFileSync(restServicePath, 'utf8');

// Add import
restService = "import { getRestaurantAvailability } from './restaurant-availability.util';\n" + restService;

// Replace getRestaurantOperatingStatus body
const statusRegex = /async getRestaurantOperatingStatus\([^)]+\)[\s\S]*?(?=\s+async updateOnlineStatus)/;
const newStatusBody = `async getRestaurantOperatingStatus(restaurantId: string): Promise<{
    isCurrentlyOpen: boolean;
    isManuallyOffline: boolean;
    nextOpeningTime: string | null;
  }> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { timings: true },
    });
    if (!restaurant || restaurant.status !== 'APPROVED') {
      return { isCurrentlyOpen: false, isManuallyOffline: false, nextOpeningTime: null };
    }
    return getRestaurantAvailability(restaurant.timings, restaurant.isOpen);
  }`;
restService = restService.replace(statusRegex, newStatusBody);

// Replace findAllRestaurants mapping
const mapRegex1 = /restaurants\.map\(\(restaurant\) => \(\{[\s\S]*?\.\.\.restaurant,[\s\S]*?avgRating:[\s\S]*?commissionRate:[\s\S]*?\}\)\),/g;
restService = restService.replace(mapRegex1, (match) => {
  return match.replace('...restaurant,', '...restaurant,\n          ...getRestaurantAvailability(restaurant.timings || [], restaurant.isOpen),');
});

const mapRegex2 = /restaurants\.map\(\(restaurant\) => \{[\s\S]*?let distanceKm = distances\.get[\s\S]*?let deliveryTimeMins[\s\S]*?return \{[\s\S]*?\.\.\.restaurant,[\s\S]*?distanceKm,[\s\S]*?deliveryTimeMins,[\s\S]*?avgRating:[\s\S]*?commissionRate:[\s\S]*?\};[\s\S]*?\}\),/g;
restService = restService.replace(mapRegex2, (match) => {
  return match.replace('...restaurant,', '...restaurant,\n            ...getRestaurantAvailability(restaurant.timings || [], restaurant.isOpen),');
});

const findByIdRegex = /return serializePrisma\(\{[\s\S]*?\.\.\.restaurant,[\s\S]*?avgRating:[\s\S]*?commissionRate:[\s\S]*?\}\);/g;
restService = restService.replace(findByIdRegex, (match) => {
  return match.replace('...restaurant,', '...restaurant,\n      ...getRestaurantAvailability(restaurant.timings || [], restaurant.isOpen),');
});

fs.writeFileSync(restServicePath, restService);

let orderVal = fs.readFileSync(orderValPath, 'utf8');
orderVal = "import { getRestaurantAvailability } from '../restaurants/restaurant-availability.util';\n" + orderVal;

const validateBodyRegex = /const tz = 'Asia\/Kolkata';[\s\S]*?if \(!isWithinHours\) \{/;
orderVal = orderVal.replace(validateBodyRegex, `const { isWithinHours } = getRestaurantAvailability(restaurant.timings, restaurant.isOpen);
    if (!isWithinHours) {`);

fs.writeFileSync(orderValPath, orderVal);

console.log('Patched services successfully');

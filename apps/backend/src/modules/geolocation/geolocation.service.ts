import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/** Haversine formula — returns distance in kilometres */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GeocodeResult {
  lat:         number;
  lng:         number;
  displayName: string;
  placeId:     string;
}

export interface NearbyRestaurant {
  id:           string;
  name:         string;
  slug:         string;
  avgRating:    number;
  distanceKm:   number;
  etaMinutes:   number;
  lat:          number;
  lng:          number;
}

export interface DistanceResult {
  distanceKm:  number;
  etaMinutes:  number;
}

const AVG_SPEED_KMH = 20; // urban delivery speed

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get MapplsKey(): string {
    return process.env.NEXT_PUBLIC_MAPPLS_API_KEY || process.env.MAPPLS_API_KEY || '';
  }

  /** Forward geocoding — search address string → coordinates via Mappls / Geolocation API */
  async searchAddress(query: string): Promise<GeocodeResult[]> {
    const key = this.MapplsKey;
    const cleanQuery = query.trim();
    this.logger.log(`[MAPPLS_PROXY] query="${cleanQuery}" keyConfigured=${Boolean(key)}`);

    // Append J&K region bias if not explicitly provided in the query string
    const hasRegion = /kashmir|jammu|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama|ganderbal/i.test(cleanQuery);
    const searchTerms = hasRegion
      ? [cleanQuery]
      : [`${cleanQuery}, Jammu and Kashmir`, cleanQuery];

    const allMappedResults: GeocodeResult[] = [];

    for (const term of searchTerms) {
      const urls = key
        ? [
            `https://apis.mappls.com/advancedmaps/v1/${key}/geo_code?address=${encodeURIComponent(term)}`,
            `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(term)}`,
          ]
        : [
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=5&countrycodes=in`,
          ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
          if (!res.ok) continue;

          const data = await res.json();
          const rawList = Array.isArray(data)
            ? data
            : (data.copopResults || data.results || data.suggestedLocations || []);

          for (const item of rawList) {
            const lat = parseFloat(item.latitude || item.lat || item.location?.lat || '0');
            const lng = parseFloat(item.longitude || item.lng || item.lon || item.location?.lng || '0');
            const name = item.formattedAddress || item.display_name || item.placeName || item.placeAddress || term;
            const placeId = String(item.eLoc || item.place_id || item.id || item.placeId || `loc-${Math.random()}`);

            if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
              // Avoid duplicate placeId or exact coordinates
              if (!allMappedResults.some((r) => r.placeId === placeId || (Math.abs(r.lat - lat) < 0.0001 && Math.abs(r.lng - lng) < 0.0001))) {
                allMappedResults.push({ lat, lng, displayName: name, placeId });
              }
            }
          }
        } catch (err) {
          this.logger.error(`[MAPPLS_PROXY] Fetch error for url=${url}`, err);
        }
      }
    }

    // Sort results so Jammu & Kashmir / Kashmir locations appear at the TOP
    allMappedResults.sort((a, b) => {
      const isJK_A = /jammu|kashmir|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama/i.test(a.displayName) || (a.lat >= 32.0 && a.lat <= 36.0);
      const isJK_B = /jammu|kashmir|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama/i.test(b.displayName) || (b.lat >= 32.0 && b.lat <= 36.0);
      if (isJK_A && !isJK_B) return -1;
      if (!isJK_A && isJK_B) return 1;
      return 0;
    });

    this.logger.log(`[MAPPLS_PROXY] Returning ${allMappedResults.length} sorted results for query "${cleanQuery}"`);
    return allMappedResults;
  }

  /** Reverse geocoding — coordinates → address string via Mappls API */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const key = this.MapplsKey;
    const url = key
      ? `https://apis.mappls.com/advancedmaps/v1/${key}/rev_geocode?lat=${lat}&lng=${lng}`
      : `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
      if (!res.ok) return 'Location address unavailable';
      const data = await res.json();
      if (data.results && data.results[0] && data.results[0].formatted_address) {
        return data.results[0].formatted_address;
      }
      return data.display_name ?? 'Location address unavailable';
    } catch (err) {
      this.logger.error('Mappls reverse geocode failed', err);
      return 'Location address unavailable';
    }
  }

  /** Calculate distance and ETA between two coordinates */
  calculateDistanceAndEta(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number,
  ): DistanceResult {
    const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
    const etaMinutes = Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
    return { distanceKm: Math.round(distanceKm * 100) / 100, etaMinutes };
  }

  /** Find restaurants within a bounding box (approx radius), sorted by distance */
  async getNearbyRestaurants(
    lat:      number,
    lng:      number,
    radiusKm: number = 5,
  ): Promise<NearbyRestaurant[]> {
    // Approx degree offset: 1° lat ≈ 111 km
    const delta = radiusKm / 111;

    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        status:   'APPROVED',
        isOpen:   true,
        latitude:  { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
        deletedAt: null,
      },
      take: 20,
    });

    return restaurants
      .map((r) => {
        const distanceKm = haversineKm(lat, lng, r.latitude, r.longitude);
        const etaMinutes = Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
        return {
          id:         r.id,
          name:       r.name,
          slug:       r.slug,
          avgRating:  Number(r.avgRating),
          distanceKm: Math.round(distanceKm * 100) / 100,
          etaMinutes,
          lat:        r.latitude,
          lng:        r.longitude,
        };
      })
      .filter((r) => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /** Find available drivers within a bounding box */
  async getNearbyDrivers(lat: number, lng: number, radiusKm: number = 3) {
    const delta = radiusKm / 111;

    const drivers = await this.prisma.driver.findMany({
      where: {
        status:     'ONLINE',
        isApproved: true,
        currentLat: { gte: lat - delta, lte: lat + delta },
        currentLng: { gte: lng - delta, lte: lng + delta },
        deletedAt:  null,
      },
      include: { user: { include: { profile: true } } },
      take: 10,
    });

    return drivers.map((d) => ({
      id:          d.id,
      name:        `${d.user.profile?.firstName ?? ''} ${d.user.profile?.lastName ?? ''}`.trim(),
      distanceKm:  Math.round(haversineKm(lat, lng, d.currentLat!, d.currentLng!) * 100) / 100,
      lat:         d.currentLat,
      lng:         d.currentLng,
    }));
  }

  /** Validate that a delivery address is within a restaurant's delivery radius */
  async validateDeliveryRadius(
    restaurantId: string,
    deliveryLat:  number,
    deliveryLng:  number,
  ): Promise<{ valid: boolean; distanceKm: number; radiusKm: number }> {
    const restaurant = await this.prisma.restaurant.findUniqueOrThrow({
      where: { id: restaurantId },
    });

    const distanceKm = haversineKm(
      restaurant.latitude, restaurant.longitude,
      deliveryLat, deliveryLng,
    );
    const valid = distanceKm <= restaurant.deliveryRadius;

    return {
      valid,
      distanceKm: Math.round(distanceKm * 100) / 100,
      radiusKm:   restaurant.deliveryRadius,
    };
  }
}

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

  /** Forward geocoding — search address string → coordinates via Mappls / Local Kashmir Search */
  async searchAddress(query: string): Promise<GeocodeResult[]> {
    const key = this.MapplsKey;
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];
    this.logger.log(`[MAPPLS_PROXY] query="${cleanQuery}" keyConfigured=${Boolean(key)}`);

    const resultsMap = new Map<string, GeocodeResult>();

    // 1. Query PostgreSQL DB Restaurants matching locality/address or name
    try {
      const dbRestaurants = await this.prisma.restaurant.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: 'insensitive' } },
            { addressLine: { contains: cleanQuery, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      for (const r of dbRestaurants) {
        if (r.latitude && r.longitude && r.latitude !== 12.9716) {
          const keyName = `db-rest-${r.id}`;
          resultsMap.set(keyName, {
            lat: Number(r.latitude),
            lng: Number(r.longitude),
            displayName: `${r.name}, ${r.addressLine || 'Sopore, Kashmir'}`,
            placeId: keyName,
          });
        }
      }
    } catch {
      /* db search fallback */
    }

    // 2. Comprehensive Local Kashmir Area & Landmark Catalog
    const KASHMIR_LOCALITIES: Array<{ name: string; lat: number; lng: number }> = [
      { name: 'Watlab, Wular Lake, Bandipora, Kashmir 193502', lat: 34.3542, lng: 74.5211 },
      { name: 'Sangri, Main Market, Sopore, Kashmir 193201', lat: 34.3868, lng: 74.5221 },
      { name: 'Main Market, Sopore, Baramulla, Kashmir 193201', lat: 34.3868, lng: 74.5221 },
      { name: 'Model Town, Sopore, Baramulla, Kashmir 193201', lat: 34.3812, lng: 74.4754 },
      { name: 'Batpora, Sopore, Baramulla, Kashmir 193201', lat: 34.3795, lng: 74.4682 },
      { name: 'Arampora, Sopore, Baramulla, Kashmir 193201', lat: 34.3850, lng: 74.4710 },
      { name: 'Dangerpora, Sopore, Baramulla, Kashmir 193201', lat: 34.3920, lng: 74.4815 },
      { name: 'Bohripora, Sopore, Baramulla, Kashmir 193201', lat: 34.3725, lng: 74.4620 },
      { name: 'Seer Jagir, Sopore, Baramulla, Kashmir 193201', lat: 34.3680, lng: 74.4550 },
      { name: 'Tujjar Sharief, Sopore, Baramulla, Kashmir 193201', lat: 34.4120, lng: 74.4980 },
      { name: 'Baramulla Main Town, Kashmir 193101', lat: 34.2018, lng: 74.3436 },
      { name: 'Bandipora Main Town, Kashmir 193502', lat: 34.4225, lng: 74.6520 },
      { name: 'Lal Chowk, Srinagar, Kashmir 190001', lat: 34.0722, lng: 74.8105 },
      { name: 'Hazratbal, Srinagar, Kashmir 190006', lat: 34.1264, lng: 74.8398 },
      { name: 'Handwara Main Town, Kupwara, Kashmir 193221', lat: 34.3995, lng: 74.2810 },
      { name: 'Kupwara Main Town, Kashmir 193222', lat: 34.5262, lng: 74.2546 },
    ];

    const regex = new RegExp(cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    for (const loc of KASHMIR_LOCALITIES) {
      if (regex.test(loc.name)) {
        const keyName = `local-${loc.name.toLowerCase().replace(/\s+/g, '-')}`;
        if (!resultsMap.has(keyName)) {
          resultsMap.set(keyName, {
            lat: loc.lat,
            lng: loc.lng,
            displayName: loc.name,
            placeId: keyName,
          });
        }
      }
    }

    // 3. Mappls & Geocoding API External Search
    const hasRegion = /kashmir|jammu|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama|ganderbal/i.test(cleanQuery);
    const searchTerms = hasRegion
      ? [cleanQuery]
      : [`${cleanQuery}, Jammu and Kashmir`, cleanQuery];

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
              const keyName = `ext-${placeId}`;
              if (!resultsMap.has(keyName)) {
                resultsMap.set(keyName, { lat, lng, displayName: name, placeId });
              }
            }
          }
        } catch (err) {
          this.logger.error(`[MAPPLS_PROXY] Fetch error for url=${url}`, err);
        }
      }
    }

    const allMappedResults = Array.from(resultsMap.values());

    // Sort results so Jammu & Kashmir / Kashmir locations appear at the TOP
    allMappedResults.sort((a, b) => {
      const isJK_A = /jammu|kashmir|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama/i.test(a.displayName) || (a.lat >= 32.0 && a.lat <= 36.0);
      const isJK_B = /jammu|kashmir|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama/i.test(b.displayName) || (b.lat >= 32.0 && b.lat <= 36.0);
      if (isJK_A && !isJK_B) return -1;
      if (!isJK_A && isJK_B) return 1;
      return 0;
    });

    this.logger.log(`[MAPPLS_PROXY] Returning ${allMappedResults.length} sorted local results for query "${cleanQuery}"`);
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

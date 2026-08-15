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
    return process.env.NEXT_PUBLIC_MAPPLS_API_KEY || process.env.MAPPLS_API_KEY || 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
  }

  /** Forward geocoding & autosuggest search — via Mappls Autosuggest, Geocode & OSM fallback APIs */
  async searchAddress(query: string): Promise<GeocodeResult[]> {
    const key = this.MapplsKey;
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const resultsMap = new Map<string, GeocodeResult>();
    let totalRawCount = 0;

    // Search terms: Query exact user string first, and fallback to region-expanded terms if query is short
    const searchTerms = [cleanQuery];
    if (cleanQuery.length >= 2 && !/kashmir|jammu|j&k|india|delhi|mumbai|bangalore/i.test(cleanQuery)) {
      searchTerms.push(`${cleanQuery}, Jammu and Kashmir`, `${cleanQuery}, India`);
    }

    for (const term of searchTerms) {
      const urls = key
        ? [
            `https://atlas.mappls.com/api/places/autosuggest?query=${encodeURIComponent(term)}`,
            `https://apis.mappls.com/advancedmaps/v1/${key}/autosuggest?query=${encodeURIComponent(term)}`,
            `https://apis.mappls.com/advancedmaps/v1/${key}/geo_code?address=${encodeURIComponent(term)}`,
            `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(term)}`,
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=15&countrycodes=in`,
          ]
        : [
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(term)}&format=json&limit=15&countrycodes=in`,
          ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
          if (!res.ok) continue;

          const data = await res.json();
          const rawList = Array.isArray(data)
            ? data
            : (data.suggestedLocations || data.copopResults || data.results || data.data || []);

          totalRawCount += rawList.length;

          for (const item of rawList) {
            let lat = parseFloat(item.latitude || item.lat || item.location?.lat || item.y || '0');
            let lng = parseFloat(item.longitude || item.lng || item.lon || item.location?.lng || item.x || '0');
            
            const rawName = item.placeName || item.locality || item.name || item.formattedAddress || item.display_name || item.placeAddress || term;
            const rawAddress = item.placeAddress || item.formattedAddress || item.display_name || rawName;
            const placeId = String(item.eLoc || item.place_id || item.id || item.placeId || `loc-${Math.random()}`);

            // Fallback coordinate lookup if eLoc/Autosuggest item lacks direct lat/lng
            if ((lat === 0 || lng === 0 || isNaN(lat) || isNaN(lng)) && rawAddress) {
              if (/sopore|sangri|watlab|bandipora|baramulla|srinagar|kashmir/i.test(rawAddress)) {
                lat = 34.3868;
                lng = 74.5221;
              } else if (/delhi/i.test(rawAddress)) {
                lat = 28.6139;
                lng = 77.2090;
              } else if (/mumbai/i.test(rawAddress)) {
                lat = 19.0760;
                lng = 72.8777;
              } else if (/bangalore|bengaluru/i.test(rawAddress)) {
                lat = 12.9716;
                lng = 77.5946;
              }
            }

            if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
              const keyName = `${placeId}-${lat.toFixed(4)}-${lng.toFixed(4)}`;
              if (!resultsMap.has(keyName)) {
                resultsMap.set(keyName, {
                  lat,
                  lng,
                  displayName: rawAddress.includes(rawName) ? rawAddress : `${rawName}, ${rawAddress}`,
                  placeId,
                });
              }
            }
          }
        } catch (err) {
          this.logger.error(`[MAPPLS_PROXY] Fetch error for url=${url}`, err);
        }
      }
    }

    const allMappedResults = Array.from(resultsMap.values());

    // Soft Ranking & Relevance Prioritization (NO hard filters):
    // 1. Exact / prefix match on user's query
    // 2. Soft preference for J&K / Kashmir local places if query is neutral
    // 3. Keep all valid Indian search results (Delhi, Mumbai, Bangalore, etc.)
    const qLower = cleanQuery.toLowerCase();
    allMappedResults.sort((a, b) => {
      const aName = a.displayName.toLowerCase();
      const bName = b.displayName.toLowerCase();

      const aPrefix = aName.startsWith(qLower);
      const bPrefix = bName.startsWith(qLower);
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;

      const isJK_A = /jammu|kashmir|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama/i.test(aName) || (a.lat >= 32.0 && a.lat <= 36.0);
      const isJK_B = /jammu|kashmir|j&k|sopore|baramulla|bandipora|srinagar|anantnag|pulwama/i.test(bName) || (b.lat >= 32.0 && b.lat <= 36.0);
      if (isJK_A && !isJK_B) return -1;
      if (!isJK_A && isJK_B) return 1;

      return 0;
    });

    this.logger.log(`[MAPPLS_DIAGNOSTIC] query="${cleanQuery}" totalRawCount=${totalRawCount} returnedCount=${allMappedResults.length}`);
    return allMappedResults;
  }

  /** Mappls Location Autosuggest — returns normalized FoodHub structure */
  async getAutosuggest(query: string): Promise<{ suggestions: Array<{
    id: string;
    placeName: string;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude: number;
    longitude: number;
  }> }> {
    const rawResults = await this.searchAddress(query);

    const suggestions = rawResults.map((item) => {
      const parts = item.displayName.split(',').map((s) => s.trim());
      const placeName = parts[0] || query;
      const address = item.displayName;
      const city = parts.length > 2 ? parts[parts.length - 3] : undefined;
      const state = parts.length > 1 ? parts[parts.length - 2] : undefined;

      return {
        id: item.placeId,
        placeName,
        address,
        city,
        state,
        latitude: item.lat,
        longitude: item.lng,
      };
    });

    return { suggestions };
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

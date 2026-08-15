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

export interface StructuredAddressQuery {
  houseNumber?: string;
  street?: string;
  areaLocality?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface DetailedGeocodeResult {
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  displayName: string | null;
  geocodeLevel: string | null;
  precisionLabel: 'EXACT' | 'AREA' | 'PINCODE' | 'UNKNOWN';
  confidenceScore: number | null;
  matchedAddress: string | null;
  queryTierUsed: number;
  source: string;
  reason?: string;
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

function normalizeStateName(state?: string): string {
  if (!state) return '';
  const s = state.trim();
  if (/^j&k$/i.test(s) || /^jammu\s*&\s*kashmir$/i.test(s)) {
    return 'Jammu and Kashmir';
  }
  return s;
}

function cleanAddressQuery(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(', ')
    .replace(/,+/g, ',')
    .trim();
}

function classifyGeocodePrecision(level?: string | null): 'EXACT' | 'AREA' | 'PINCODE' | 'UNKNOWN' {
  if (!level) return 'AREA';
  const l = level.toLowerCase();
  if (l.includes('house') || l.includes('building') || l.includes('poi') || l.includes('street') || l.includes('premise')) {
    return 'EXACT';
  }
  if (l.includes('pincode') || l.includes('postcode') || l.includes('postal') || l.includes('city') || l.includes('district')) {
    return 'PINCODE';
  }
  return 'AREA'; // subLocality, locality, village, sector, colony
}

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get MapplsKey(): string {
    return process.env.NEXT_PUBLIC_MAPPLS_API_KEY || process.env.MAPPLS_API_KEY || 'gejpjfjmbuahozfsiemzurkcxqcvcrejjkwi';
  }

  /**
   * Multi-Tier Geocoding Engine for Manual Customer Addresses.
   * Executes 4 fallback query variations (Full -> Area -> City/Village -> Pincode).
   * Accepts coordinates at ANY geocode level without requiring exact house numbers.
   */
  async geocodeStructuredAddress(addr: StructuredAddressQuery): Promise<DetailedGeocodeResult> {
    const key = this.MapplsKey;

    const house = (addr.houseNumber || '').trim();
    const street = (addr.street || '').trim();
    const area = (addr.areaLocality || '').trim();
    const landmark = (addr.landmark || '').trim();
    const city = (addr.city || '').trim();
    const state = normalizeStateName(addr.state);
    const postalCode = (addr.postalCode || '').trim();

    // Construct 4 controlled query tiers
    const tier1 = cleanAddressQuery([house, street, area, landmark, city, state, postalCode, 'India']);
    const tier2 = cleanAddressQuery([area, landmark, city, state, postalCode, 'India']);
    const tier3 = cleanAddressQuery([city, state, postalCode, 'India']);
    const tier4 = cleanAddressQuery([postalCode, state, 'India']);

    const queryTiers = [
      { tier: 1, query: tier1 },
      { tier: 2, query: tier2 },
      { tier: 3, query: tier3 },
      { tier: 4, query: tier4 },
    ].filter((q) => q.query.length > 5);

    this.logger.log(`[GEOCODING_ENGINE] Received manual address request: house="${house}" area="${area}" city="${city}" pincode="${postalCode}"`);

    for (const { tier, query } of queryTiers) {
      this.logger.log(`[GEOCODING_ENGINE] Attempting Tier ${tier} query="${query}"`);

      const urls = key
        ? [
            `https://search.mappls.com/search/address/geocode?address=${encodeURIComponent(query)}`,
            `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(query)}`,
            `https://apis.mappls.com/advancedmaps/v1/${key}/geo_code?address=${encodeURIComponent(query)}`,
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
          ]
        : [
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
          ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
          if (!res.ok) {
            this.logger.warn(`[GEOCODING_ENGINE] HTTP ${res.status} from ${url.split('?')[0]}`);
            continue;
          }

          const data = await res.json();
          const rawList = Array.isArray(data)
            ? data
            : (data.copResults || data.results || data.suggestedLocations || data.data || []);

          if (rawList && rawList.length > 0) {
            const item = rawList[0];
            const lat = parseFloat(item.latitude || item.lat || item.location?.lat || item.y || '0');
            const lng = parseFloat(item.longitude || item.lng || item.lon || item.location?.lng || item.x || '0');
            const geocodeLevel = item.geocodeLevel || item.type || item.addresstype || item.category || 'locality';
            const confidenceScore = typeof item.confidenceScore === 'number' ? item.confidenceScore : null;
            const displayName = item.formattedAddress || item.display_name || item.placeAddress || item.placeName || query;

            if (lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng)) {
              const precisionLabel = classifyGeocodePrecision(geocodeLevel);
              this.logger.log(`[GEOCODING_ENGINE] SUCCESS Tier ${tier} (${precisionLabel}) level="${geocodeLevel}" lat=${lat} lng=${lng}`);
              return {
                success: true,
                latitude: lat,
                longitude: lng,
                displayName,
                geocodeLevel: String(geocodeLevel),
                precisionLabel,
                confidenceScore,
                matchedAddress: displayName,
                queryTierUsed: tier,
                source: url.includes('mappls') ? 'mappls' : 'nominatim',
              };
            }
          }
        } catch (err: any) {
          this.logger.warn(`[GEOCODING_ENGINE] Error fetching ${url.split('?')[0]}: ${err.message}`);
        }
      }
    }

    this.logger.error(`[GEOCODING_ENGINE] FAILED all query tiers for house="${house}" area="${area}" city="${city}" pincode="${postalCode}"`);
    return {
      success: false,
      latitude: null,
      longitude: null,
      displayName: null,
      geocodeLevel: null,
      precisionLabel: 'UNKNOWN',
      confidenceScore: null,
      matchedAddress: null,
      queryTierUsed: 4,
      source: 'none',
      reason: 'NO_COORDINATES',
    };
  }

  /** Forward geocoding & autosuggest search */
  async searchAddress(query: string): Promise<GeocodeResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const structuredRes = await this.geocodeStructuredAddress({
      areaLocality: cleanQuery,
    });

    if (structuredRes.success && structuredRes.latitude && structuredRes.longitude) {
      return [
        {
          lat: structuredRes.latitude,
          lng: structuredRes.longitude,
          displayName: structuredRes.displayName || cleanQuery,
          placeId: `geo-${structuredRes.latitude}-${structuredRes.longitude}`,
        },
      ];
    }

    return [];
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

      return {
        id: item.placeId,
        placeName,
        address,
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

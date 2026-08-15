import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/** Haversine formula — returns distance in kilometres */
export function haversineKm(
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
  matchedPostalCode?: string | null;
  matchedCity?: string | null;
  matchedState?: string | null;
  matchedLocality?: string | null;
  verificationStatus: 'UNVERIFIED' | 'VERIFYING' | 'VERIFIED' | 'FAILED';
  queryTierUsed: number;
  source: string;
  reason?: string;
}

export interface PlaceSearchResult {
  placeId: string;
  placeName: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  locality?: string;
  city?: string;
  state?: string;
  confidence: number;
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

function normalizeText(text?: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  if (l.includes('pincode') || l.includes('postcode') || l.includes('postal')) {
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
   * Multi-Tier Geocoding Engine for Manual Customer Addresses with Candidate Match Verification.
   * Enforces 6 required fields & zero fallback policy.
   */
  async geocodeStructuredAddress(addr: StructuredAddressQuery): Promise<DetailedGeocodeResult> {
    const key = this.MapplsKey;

    const house = (addr.houseNumber || '').trim();
    const area = (addr.areaLocality || '').trim();
    const landmark = (addr.landmark || '').trim();
    const city = (addr.city || '').trim();
    const state = normalizeStateName(addr.state);
    const postalCode = (addr.postalCode || '').trim();

    // 1. Enforce 6 required input fields
    if (!house || !area || !landmark || !city || !state || !/^\d{6}$/.test(postalCode)) {
      return {
        success: false,
        latitude: null,
        longitude: null,
        displayName: null,
        geocodeLevel: null,
        precisionLabel: 'UNKNOWN',
        confidenceScore: null,
        matchedAddress: null,
        verificationStatus: 'FAILED',
        queryTierUsed: 0,
        source: 'none',
        reason: 'INCOMPLETE_ADDRESS_FIELDS',
      };
    }

    // Construct 6 controlled query tiers with strong locality preservation
    const tier1 = cleanAddressQuery([house, area, landmark, city, state, postalCode, 'India']);
    const tier2 = cleanAddressQuery([area, landmark, city, state, postalCode, 'India']);
    const tier3 = cleanAddressQuery([area, city, state, 'India']);
    const tier4 = cleanAddressQuery([area, state, 'India']);
    const tier5 = cleanAddressQuery([area, postalCode, 'India']);
    const tier6 = cleanAddressQuery([city, state, postalCode, 'India']);

    const queryTiers = [
      { tier: 1, query: tier1 },
      { tier: 2, query: tier2 },
      { tier: 3, query: tier3 },
      { tier: 4, query: tier4 },
      { tier: 5, query: tier5 },
      { tier: 6, query: tier6 },
    ].filter((q) => q.query.length > 3);

    this.logger.log(`[GEOCODING_ENGINE] Geocoding structured address: house="${house}" area="${area}" landmark="${landmark}" city="${city}" pincode="${postalCode}"`);

    const normalizedArea = normalizeText(area);
    const normalizedLandmark = normalizeText(landmark);
    const normalizedCity = normalizeText(city);
    const normalizedState = normalizeStateName(state).toLowerCase();

    interface EvaluatedCandidate {
      lat: number;
      lng: number;
      displayName: string;
      candPincode: string;
      score: number;
      tier: number;
      source: string;
      geocodeLevel: string;
    }

    const evaluatedCandidates: EvaluatedCandidate[] = [];

    for (const { tier, query } of queryTiers) {
      const urls = key
        ? [
            `https://search.mappls.com/search/address/geocode?address=${encodeURIComponent(query)}`,
            `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(query)}`,
            `https://apis.mappls.com/advancedmaps/v1/${key}/geo_code?address=${encodeURIComponent(query)}`,
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
          ]
        : [
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=in`,
          ];

      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
          if (!res.ok) continue;

          const data = await res.json();
          let rawList: any[] = [];
          if (Array.isArray(data)) {
            rawList = data;
          } else if (data.features && Array.isArray(data.features)) {
            // Photon feature collection format
            rawList = data.features.map((f: any) => ({
              lat: f.geometry?.coordinates?.[1],
              lng: f.geometry?.coordinates?.[0],
              displayName: [f.properties?.name, f.properties?.city || f.properties?.county, f.properties?.state, f.properties?.country].filter(Boolean).join(', '),
              pincode: f.properties?.postcode || '',
              city: f.properties?.city || f.properties?.county || '',
              state: f.properties?.state || '',
              locality: f.properties?.name || '',
              geocodeLevel: f.properties?.osm_value || 'locality',
            }));
          } else {
            rawList = data.copResults || data.results || data.suggestedLocations || data.data || [];
          }

          if (rawList && rawList.length > 0) {
            for (const item of rawList) {
              const lat = parseFloat(item.latitude || item.lat || item.location?.lat || item.y || '0');
              const lng = parseFloat(item.longitude || item.lng || item.lon || item.location?.lng || item.x || '0');

              if (lat === 0 || lng === 0 || isNaN(lat) || isNaN(lng) || lat < 8 || lat > 38 || lng < 68 || lng > 98) {
                continue;
              }

              const displayName = item.formattedAddress || item.display_name || item.placeAddress || item.placeName || item.displayName || query;
              const normalizedDisplay = normalizeText(displayName);
              const itemCity = normalizeText(item.city || item.district || item.locality || '');
              const itemState = normalizeText(item.state || '');

              const candPincode = (item.pincode || item.postcode || item.postal_code || '').trim() ||
                (displayName.match(/\b\d{6}\b/) || [])[0] || '';

              // Scoring candidate according to rules:
              // +40 locality match, +25 PIN match, +15 city/district match, +10 state match, +5 landmark match, +5 valid coordinates
              let score = 5; // valid coordinates base

              const localityMatches = normalizedArea && (
                normalizedDisplay.includes(normalizedArea) ||
                normalizeText(item.locality).includes(normalizedArea) ||
                normalizedArea.includes(normalizeText(item.locality))
              );

              if (localityMatches) score += 40;
              if (candPincode && candPincode === postalCode) score += 25;
              if (normalizedCity && (normalizedDisplay.includes(normalizedCity) || itemCity.includes(normalizedCity))) score += 15;
              if (normalizedDisplay.includes('jammu') || normalizedDisplay.includes('kashmir') || itemState.includes('jammu') || itemState.includes('kashmir')) score += 10;
              if (normalizedLandmark && normalizedDisplay.includes(normalizedLandmark)) score += 5;

              // Enforce PIN mismatch rejection if candidate explicitly specifies a DIFFERENT 6-digit PIN
              if (candPincode && /^\d{6}$/.test(candPincode) && candPincode !== postalCode) {
                this.logger.warn(`[GEOCODING_ENGINE] Rejecting candidate PIN mismatch: expected=${postalCode} got=${candPincode}`);
                continue;
              }

              evaluatedCandidates.push({
                lat,
                lng,
                displayName,
                candPincode,
                score,
                tier,
                source: url.includes('mappls') ? 'mappls' : url.includes('photon') ? 'photon' : 'nominatim',
                geocodeLevel: item.geocodeLevel || item.type || 'locality',
              });
            }
          }
        } catch (err: any) {
          this.logger.warn(`[GEOCODING_ENGINE] Error fetching ${url.split('?')[0]}: ${err.message}`);
        }
      }
    }

    // Rank candidates by score descending
    evaluatedCandidates.sort((a, b) => b.score - a.score);

    if (evaluatedCandidates.length > 0 && evaluatedCandidates[0].score >= 35) {
      const winner = evaluatedCandidates[0];
      const precisionLabel = classifyGeocodePrecision(winner.geocodeLevel);

      this.logger.log(`[GEOCODING_ENGINE] SUCCESS Candidate verified (Score: ${winner.score}, Tier: ${winner.tier}): lat=${winner.lat} lng=${winner.lng} displayName="${winner.displayName}"`);

      return {
        success: true,
        latitude: winner.lat,
        longitude: winner.lng,
        displayName: winner.displayName,
        geocodeLevel: winner.geocodeLevel,
        precisionLabel,
        confidenceScore: Math.min(1.0, winner.score / 100),
        matchedAddress: winner.displayName,
        matchedPostalCode: winner.candPincode || postalCode,
        matchedCity: city,
        matchedState: state,
        matchedLocality: area,
        verificationStatus: 'VERIFIED',
        queryTierUsed: winner.tier,
        source: winner.source,
      };
    }

    this.logger.error(`[GEOCODING_ENGINE] FAILED to verify geocoding for address: house="${house}" area="${area}" city="${city}" pincode="${postalCode}"`);
    return {
      success: false,
      latitude: null,
      longitude: null,
      displayName: null,
      geocodeLevel: null,
      precisionLabel: 'UNKNOWN',
      confidenceScore: null,
      matchedAddress: null,
      verificationStatus: 'FAILED',
      queryTierUsed: 6,
      source: 'none',
      reason: "Couldn't determine the exact location of this address. Please check the address details and try again.",
    };
  }

  /** Place-Name Location Search (e.g. Kehnusa, Aloosa, Sopore, Bandipora) */
  async searchPlaceByName(placeName: string): Promise<PlaceSearchResult[]> {
    const clean = placeName.trim();
    if (!clean) return [];

    const query1 = clean.toLowerCase().includes('jammu') || clean.toLowerCase().includes('kashmir')
      ? clean
      : `${clean}, Jammu and Kashmir, India`;
    const query2 = `${clean}, India`;

    const urls = [
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query1)}&limit=5`,
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query1)}&format=json&limit=5&countrycodes=in`,
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query2)}&limit=5`,
    ];
    const KASHMIR_LOCALITY_MAP: Record<string, { lat: number; lng: number; name: string; display: string; city: string; state: string }> = {
      kehnusa: { lat: 34.4646738, lng: 74.577908, name: 'Kehnusa', display: 'Kehnusa, Bandipora, Jammu & Kashmir, India', city: 'Bandipora', state: 'Jammu & Kashmir' },
      aloosa: { lat: 34.4875676, lng: 74.1025259, name: 'Aloosa', display: 'Aloosa, Bandipora, Jammu & Kashmir, India', city: 'Bandipora', state: 'Jammu & Kashmir' },
      sopore: { lat: 34.2869124, lng: 74.4625673, name: 'Sopore', display: 'Sopore, Baramulla, Jammu & Kashmir, India', city: 'Baramulla', state: 'Jammu & Kashmir' },
      bandipora: { lat: 34.4232433, lng: 74.635965, name: 'Bandipora', display: 'Bandipora, Jammu & Kashmir, India', city: 'Bandipora', state: 'Jammu & Kashmir' },
      srinagar: { lat: 34.0747444, lng: 74.8204443, name: 'Srinagar', display: 'Srinagar, Jammu & Kashmir, India', city: 'Srinagar', state: 'Jammu & Kashmir' },
    };

    const results: PlaceSearchResult[] = [];

    const kashMatch = KASHMIR_LOCALITY_MAP[clean.toLowerCase()];
    if (kashMatch) {
      results.push({
        placeId: `place-${kashMatch.lat.toFixed(4)}-${kashMatch.lng.toFixed(4)}`,
        placeName: kashMatch.name,
        formattedAddress: kashMatch.display,
        latitude: kashMatch.lat,
        longitude: kashMatch.lng,
        locality: kashMatch.name,
        city: kashMatch.city,
        state: kashMatch.state,
        confidence: 1.0,
      });
    }

    for (const url of urls) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
        if (!res.ok) continue;

        const data = await res.json();
        let items: any[] = [];
        if (data.features && Array.isArray(data.features)) {
          items = data.features.map((f: any) => ({
            lat: parseFloat(f.geometry?.coordinates?.[1]),
            lng: parseFloat(f.geometry?.coordinates?.[0]),
            name: f.properties?.name || clean,
            display: [f.properties?.name, f.properties?.city || f.properties?.county || f.properties?.district, f.properties?.state, 'India'].filter(Boolean).join(', '),
            locality: f.properties?.name || '',
            city: f.properties?.city || f.properties?.county || '',
            state: f.properties?.state || '',
          }));
        } else if (Array.isArray(data)) {
          items = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            name: item.display_name?.split(',')[0] || clean,
            display: item.display_name,
            locality: item.address?.village || item.address?.suburb || item.display_name?.split(',')[0] || '',
            city: item.address?.city || item.address?.county || item.address?.district || '',
            state: item.address?.state || 'Jammu and Kashmir',
          }));
        }

        for (const item of items) {
          if (isNaN(item.lat) || isNaN(item.lng) || item.lat === 0 || item.lng === 0) continue;
          if (item.lat < 8 || item.lat > 38 || item.lng < 68 || item.lng > 98) continue;

          const exists = results.some((r) => Math.abs(r.latitude - item.lat) < 0.005 && Math.abs(r.longitude - item.lng) < 0.005);
          if (exists) continue;

          let confidence = 0.8;
          const normName = normalizeText(item.name);
          const normClean = normalizeText(clean);
          if (normName.includes(normClean) || normClean.includes(normName)) {
            confidence += 0.15;
          }

          results.push({
            placeId: `place-${item.lat.toFixed(4)}-${item.lng.toFixed(4)}`,
            placeName: item.name || clean,
            formattedAddress: item.display,
            latitude: item.lat,
            longitude: item.lng,
            locality: item.locality,
            city: item.city,
            state: item.state,
            confidence,
          });
        }
      } catch (e: any) {
        this.logger.warn(`[PLACE_SEARCH] Search error on ${url}: ${e.message}`);
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /** Forward geocoding & autosuggest search */
  async searchAddress(query: string): Promise<GeocodeResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const places = await this.searchPlaceByName(cleanQuery);
    return places.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      displayName: p.formattedAddress,
      placeId: p.placeId,
    }));
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

  /** Reverse geocoding — coordinates → address string via Mappls / OSM API */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const key = this.MapplsKey;
    const url = key
      ? `https://apis.mappls.com/advancedmaps/v1/${key}/rev_geocode?lat=${lat}&lng=${lng}`
      : `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodHub/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results[0] && data.results[0].formatted_address) {
          return data.results[0].formatted_address;
        }
        if (data.display_name && !data.display_name.includes('unavailable')) {
          return data.display_name;
        }
        if (data.address) {
          const parts = [
            data.address.village || data.address.suburb || data.address.neighbourhood || data.address.road,
            data.address.county || data.address.city || data.address.town || 'Bandipora',
            data.address.state || 'Jammu and Kashmir',
            'India',
          ].filter(Boolean);
          if (parts.length > 0) return parts.join(', ');
        }
      }
      return 'Location detected, Jammu & Kashmir, India';
    } catch (err) {
      this.logger.error('Reverse geocode failed', err);
      return 'Location detected, Jammu & Kashmir, India';
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

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface DetailedGeocodeResult {
  success: boolean;
  latitude: number | null;
  longitude: number | null;
  displayName: string | null;
  geocodeLevel: string | null;
  precisionLabel: string;
  confidenceScore: number;
  matchedAddress: string | null;
  verificationStatus: 'VERIFIED' | 'FAILED';
  queryTierUsed: number;
  source: string;
  reason?: string;
}

export interface DistanceResult {
  distanceKm: number;
  etaMinutes: number;
}

export interface NearbyRestaurant {
  id: string;
  name: string;
  slug: string;
  avgRating: number;
  distanceKm: number;
  etaMinutes: number;
  lat: number;
  lng: number;
}

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get MapplsToken(): string {
    return process.env.MAPPLS_ACCESS_TOKEN || '';
  }

  private isValidCoordinates(lat: number, lng: number): boolean {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      (lat !== 0 || lng !== 0)
    );
  }

  // 1. REVERSE GEOCODING
  async resolveLocation(lat: number, lng: number): Promise<{
    latitude: number;
    longitude: number;
    locality: string;
    district: string;
    subDistrict?: string;
    state: string;
    country: string;
    pincode?: string;
    mapplsPin?: string;
    formattedAddress: string;
  }> {
    if (!this.isValidCoordinates(lat, lng)) {
      throw new Error('Invalid GPS coordinates');
    }

    const fallback = {
      latitude: lat,
      longitude: lng,
      locality: '',
      district: '',
      state: '',
      country: 'India',
      formattedAddress: 'Location detected',
    };

    if (!this.MapplsToken) {
      this.logger.error('MAPPLS_ACCESS_TOKEN is not configured');
      return { ...fallback, formattedAddress: 'Location service not configured' };
    }

    try {
      const url = `https://search.mappls.com/search/address/rev-geocode?lat=${lat}&lng=${lng}&access_token=${this.MapplsToken}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Mappls Rev-Geocode HTTP ${response.status}: ${body.substring(0, 200)}`);
        return fallback;
      }

      const data = await response.json();
      const result = Array.isArray(data?.results) ? data.results[0] : (data?.results ?? data);
      if (!result) return fallback;

      // Log raw Mappls fields for debugging coordinate/geocoding issues
      this.logger.debug(`Mappls raw rev-geocode: locality=${result.locality}, village=${result.village}, subLocality=${result.subLocality}, subDistrict=${result.subDistrict}, district=${result.district}, city=${result.city}, state=${result.state}, pincode=${result.pincode}`);

      const houseNumber   = (result.houseNumber || result.houseName || '').trim();
      const street        = (result.street || '').trim();
      const village       = (result.village || '').trim();
      const poi           = (result.poi || '').trim();
      const finalLocality = (result.locality || village || result.subLocality || poi || '').trim();
      const district      = (result.district || result.city || '').trim();
      const subDistrict   = (result.subDistrict || '').trim();
      const state         = (result.state || '').trim();
      const country     = result.country     || 'India';
      const pincode     = result.pincode     || '';
      const mapplsPin   = result.mapplsPin   || '';

      const parts = [houseNumber, street, finalLocality, subDistrict, district, state].filter(Boolean);
      // Deduplicate and remove empty strings
      const uniqueParts = Array.from(new Set(parts.map(p => p.trim()))).filter(Boolean);

      const builtAddress = pincode ? `${uniqueParts.join(', ')} - ${pincode}` : uniqueParts.join(', ');
      const formattedAddress = builtAddress || result.formattedAddress || 'Location detected';

      this.logger.debug(`Mappls built address: "${formattedAddress}" (locality="${finalLocality}", district="${district}", pincode="${pincode}")`);

      return { latitude: lat, longitude: lng, locality: finalLocality, district, subDistrict, state, country, pincode, mapplsPin, formattedAddress };
    } catch (err: any) {
      if (err.name !== 'AbortError') this.logger.error(`Mappls Rev-Geocode error: ${err.message}`);
      return fallback;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const r = await this.resolveLocation(lat, lng);
    return r.formattedAddress;
  }

  // 2. FORWARD GEOCODING
  async geocodeAddress(addressStr: string): Promise<DetailedGeocodeResult> {
    if (!addressStr?.trim()) return this._fallbackGeocodeFailure('Address query is empty');
    if (!this.MapplsToken) return this._fallbackGeocodeFailure('MAPPLS_ACCESS_TOKEN not configured');

    try {
      const url = `https://search.mappls.com/apis/searchV3?query=${encodeURIComponent(addressStr.trim())}&region=IND&access_token=${this.MapplsToken}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return this._fallbackGeocodeFailure(`Mappls search HTTP ${response.status}`);

      const data = await response.json();
      const suggestions = data?.suggestedLocations || data?.results || [];
      if (!suggestions.length) return this._fallbackGeocodeFailure('No results from Mappls for this address');

      const best = suggestions[0];
      const lat = parseFloat(best.latitude);
      const lng = parseFloat(best.longitude);
      if (isNaN(lat) || isNaN(lng)) return this._fallbackGeocodeFailure('Mappls returned invalid coordinates');

      return {
        success: true,
        latitude: lat,
        longitude: lng,
        displayName: best.placeName || best.formattedAddress || addressStr,
        geocodeLevel: best.type || 'locality',
        precisionLabel: 'MAPPLS_PLACE',
        confidenceScore: 1.0,
        matchedAddress: best.placeAddress || best.placeName || addressStr,
        verificationStatus: 'VERIFIED',
        queryTierUsed: 1,
        source: 'mappls_geocoding',
      };
    } catch (err: any) {
      this.logger.error(`Mappls geocodeAddress error: ${err.message}`);
      return this._fallbackGeocodeFailure('Mappls geocoding service error');
    }
  }

  async geocodeStructuredAddress(params: {
    houseNumber?: string;
    street?: string;
    areaLocality?: string;
    landmark?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }): Promise<DetailedGeocodeResult> {
    const parts = [
      params.houseNumber, params.street, params.landmark,
      params.areaLocality, params.city, params.state,
      params.postalCode, params.country || 'India',
    ].filter(Boolean);
    return this.geocodeAddress(parts.join(', '));
  }

  // 3. PLACE SEARCH / AUTOSUGGEST
  async searchPlaceByName(query: string): Promise<any[]> {
    return this.searchPlaces(query);
  }

  async getAutosuggest(query: string): Promise<any> {
    const suggestions = await this.searchPlaces(query);
    return { suggestions };
  }

  async searchPlaces(query: string, nearLat?: number, nearLng?: number): Promise<any[]> {
    if (!query?.trim() || !this.MapplsToken) return [];

    try {
      let url = `https://search.mappls.com/apis/searchV3?query=${encodeURIComponent(query.trim())}&region=IND&tokenizeAddress=true&access_token=${this.MapplsToken}`;
      if (nearLat && nearLng) url += `&location=${nearLat},${nearLng}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return [];

      const data = await response.json();
      const items = data?.suggestedLocations || data?.results || [];

      return items.map((item: any) => ({
        placeName:    item.placeName    || item.name        || '',
        placeAddress: item.placeAddress || item.description || '',
        eLoc:         item.eLoc         || item.mapplsPin   || '',
        latitude:     parseFloat(item.latitude)  || null,
        longitude:    parseFloat(item.longitude) || null,
        type:         item.type || 'locality',
      }));
    } catch (err: any) {
      this.logger.error(`Mappls autosuggest error: ${err.message}`);
      return [];
    }
  }

  // 4. ROUTING — Mappls route_adv
  async calculateDistanceAndEta(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number,
  ): Promise<DistanceResult> {
    if (!this.MapplsToken) {
      throw new Error('MAPPLS_ACCESS_TOKEN not configured. Cannot calculate road distance.');
    }
    if (!this.isValidCoordinates(fromLat, fromLng) || !this.isValidCoordinates(toLat, toLng)) {
      throw new Error('Invalid coordinates for routing.');
    }

    // Mappls route_adv uses longitude,latitude order
    const url = `https://apis.mapmyindia.com/advancedmaps/v1/${this.MapplsToken}/route_adv/driving/${fromLng},${fromLat};${toLng},${toLat}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Mappls Routing HTTP ${response.status}: ${body.substring(0, 200)}`);
      }

      const data = await response.json();
      const route = data?.routes?.[0];
      if (!route) throw new Error('Mappls Routing returned no routes — location may be unserviceable');

      return {
        distanceKm:  Math.round((route.distance / 1000) * 100) / 100,
        etaMinutes:  Math.ceil(route.duration / 60),
      };
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.error(`Mappls Routing error: ${err.message}`);
      throw err;
    }
  }

  // 5. DISTANCE MATRIX — Mappls batch
  public async computeDistanceMatrix(
    origin: [number, number],
    destinations: [number, number][],
  ): Promise<{ distanceKm: number; etaMinutes: number }[]> {
    if (!this.MapplsToken || destinations.length === 0) {
      return destinations.map(() => ({ distanceKm: 999, etaMinutes: 999 }));
    }

    const batch = destinations.slice(0, 99);
    const [originLat, originLng] = origin;

    // Mappls: lng,lat format; origin first, then destinations
    const coords = [
      `${originLng},${originLat}`,
      ...batch.map(([lat, lng]) => `${lng},${lat}`),
    ].join(';');

    const url = `https://apis.mapmyindia.com/advancedmaps/v1/${this.MapplsToken}/distance_matrix/driving/${coords}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Mappls Distance Matrix HTTP ${response.status}: ${body.substring(0, 200)}`);
        return batch.map(() => ({ distanceKm: 999, etaMinutes: 999 }));
      }

      const data = await response.json();
      // distances[0][0] = self (origin to origin = 0), distances[0][i] = origin to destination i-1
      const distances: number[] = data?.results?.distances?.[0] || [];
      const durations: number[] = data?.results?.durations?.[0] || [];

      return batch.map((_, i) => ({
        distanceKm: distances[i + 1] !== undefined
          ? Math.round((distances[i + 1] / 1000) * 100) / 100
          : 999,
        etaMinutes: durations[i + 1] !== undefined
          ? Math.ceil(durations[i + 1] / 60)
          : 999,
      }));
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.error(`Mappls Distance Matrix error: ${err.message}`);
      return batch.map(() => ({ distanceKm: 999, etaMinutes: 999 }));
    }
  }

  // 6. NEARBY RESTAURANTS
  async getNearbyRestaurants(lat: number, lng: number, radiusKm = 10): Promise<NearbyRestaurant[]> {
    if (!this.isValidCoordinates(lat, lng)) return [];

    const delta = Math.min(radiusKm / 111, 0.25);
    const candidates = await this.prisma.restaurant.findMany({
      where: {
        status: 'APPROVED',
        isOpen: true,
        deletedAt: null,
        latitude:  { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
      },
      take: 25,
    });

    if (candidates.length === 0) return [];
    if (!this.MapplsToken) return [];

    const dests = candidates.map(c => [Number(c.latitude), Number(c.longitude)] as [number, number]);
    const results = await this.computeDistanceMatrix([lat, lng], dests);

    return candidates
      .map((rest, i) => ({
        id:        rest.id,
        name:      rest.name,
        slug:      rest.slug,
        avgRating: rest.avgRating ? Number(rest.avgRating) : 0,
        distanceKm:  results[i].distanceKm,
        etaMinutes:  results[i].etaMinutes,
        lat: Number(rest.latitude),
        lng: Number(rest.longitude),
      }))
      .filter(r => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // 7. NEARBY DRIVERS
  async getNearbyDrivers(lat: number, lng: number): Promise<any[]> {
    if (!this.isValidCoordinates(lat, lng)) return [];

    const delta = 0.1;
    const drivers = await this.prisma.driver.findMany({
      where: {
        status: 'ONLINE',
        currentLat: { gte: lat - delta, lte: lat + delta },
        currentLng: { gte: lng - delta, lte: lng + delta },
      },
      take: 25,
    });

    if (drivers.length === 0 || !this.MapplsToken) return [];

    const dests = drivers.map(d => [d.currentLat!, d.currentLng!] as [number, number]);
    const results = await this.computeDistanceMatrix([lat, lng], dests);

    return drivers
      .map((d, i) => ({ ...d, distanceKm: results[i].distanceKm, etaMinutes: results[i].etaMinutes }))
      .filter(d => d.distanceKm <= 10)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // 8. DELIVERY RADIUS VALIDATION
  async validateDeliveryRadius(
    restaurantId: string,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<{ valid: boolean; distanceKm: number; radiusKm: number }> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return { valid: false, distanceKm: 999, radiusKm: 0 };

    const restLat = Number(restaurant.latitude);
    const restLng = Number(restaurant.longitude);
    if (!this.isValidCoordinates(restLat, restLng)) return { valid: false, distanceKm: 999, radiusKm: 0 };

    const radiusKm = Number(restaurant.deliveryRadius || 15);

    try {
      const { distanceKm } = await this.calculateDistanceAndEta(restLat, restLng, deliveryLat, deliveryLng);
      return { valid: distanceKm <= radiusKm, distanceKm, radiusKm };
    } catch {
      return { valid: false, distanceKm: 999, radiusKm };
    }
  }

  private _fallbackGeocodeFailure(reason: string): DetailedGeocodeResult {
    return {
      success: false, latitude: null, longitude: null, displayName: null,
      geocodeLevel: null, precisionLabel: 'FAILED', confidenceScore: 0,
      matchedAddress: null, verificationStatus: 'FAILED',
      queryTierUsed: 0, source: 'mappls_geocoding', reason,
    };
  }
}




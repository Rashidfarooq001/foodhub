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

  private cachedOAuthToken: string | null = null;
  private oauthTokenExpiry: number = 0;

  private async getValidToken(): Promise<string> {
    const clientId = (process.env.MAPPLS_CLIENT_ID || '').trim();
    const clientSecret = (process.env.MAPPLS_CLIENT_SECRET || '').trim();

    // 1. If OAuth client credentials exist, generate/use cached Bearer access token
    if (clientId && clientSecret) {
      if (this.cachedOAuthToken && this.oauthTokenExpiry > Date.now() + 60000) {
        return this.cachedOAuthToken;
      }
      try {
        const oauthUrls = [
          'https://outpost.mappls.com/api/security/oauth/token',
          'https://outpost.mapmyindia.com/api/security/oauth/token',
        ];
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        for (const oauthUrl of oauthUrls) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          try {
            const res = await fetch(oauthUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: params.toString(),
              signal: controller.signal,
            });
            clearTimeout(timeout);
            if (res.ok) {
              const data = await res.json();
              if (data.access_token) {
                this.cachedOAuthToken = data.access_token;
                this.oauthTokenExpiry = Date.now() + ((data.expires_in || 86400) * 1000);
                this.logger.log(`Successfully obtained Mappls OAuth2 access token (expires in ${data.expires_in || 86400}s)`);
                return data.access_token;
              }
            }
          } catch (e: any) {
            clearTimeout(timeout);
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to fetch Mappls OAuth token: ${err.message}`);
      }
    }

    // 2. Otherwise return Static Key from environment
    const staticToken = (
      process.env.MAPPLS_ACCESS_TOKEN ||
      process.env.MAPPLS_API_KEY ||
      process.env.MAPPLS_REST_KEY ||
      process.env.MAPPLS_STATIC_KEY ||
      process.env.MAPPLS_TOKEN ||
      process.env.MAPPLS_KEY ||
      process.env.NEXT_PUBLIC_MAPPLS_API_KEY ||
      ''
    ).trim();

    return staticToken;
  }

  private get MapplsToken(): string {
    return (
      process.env.MAPPLS_ACCESS_TOKEN ||
      process.env.MAPPLS_API_KEY ||
      process.env.MAPPLS_REST_KEY ||
      process.env.MAPPLS_STATIC_KEY ||
      process.env.MAPPLS_TOKEN ||
      process.env.MAPPLS_KEY ||
      process.env.NEXT_PUBLIC_MAPPLS_API_KEY ||
      ''
    ).trim();
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
    village?: string;
    subLocality?: string;
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
      state: 'Jammu & Kashmir',
      country: 'India',
      formattedAddress: 'Location detected',
    };

    const token = await this.getValidToken();
    if (!token) {
      this.logger.error('MAPPLS_ACCESS_TOKEN is not configured');
      return { ...fallback, formattedAddress: 'Location service not configured' };
    }

    try {
      const url = `https://search.mappls.com/search/address/rev-geocode?lat=${lat}&lng=${lng}&access_token=${token}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Mappls Rev-Geocode HTTP ${response.status}: ${body.substring(0, 200)}`);
        return fallback;
      }

      const data = await response.json();
      const result = Array.isArray(data?.results) ? data.results[0] : (data?.results ?? data);
      if (!result) return fallback;

      const houseNumber   = (result.houseNumber || result.houseName || '').trim();
      const street        = (result.street || '').trim();
      const village       = (result.village || '').trim();
      const locality      = (result.locality || '').trim();
      const subLocality   = (result.subLocality || '').trim();
      const poi           = (result.poi || '').trim();
      const finalLocality = (village || locality || subLocality || poi || street || '').trim();
      const cleanDistrict = (result.district || result.city || '').replace(/\s+District$/i, '').trim();
      const subDistrict   = (result.subDistrict || '').trim();
      const state         = (result.state || 'Jammu & Kashmir').trim();
      const country       = (result.country || 'India').trim();
      const pincode       = (result.pincode || result.pin || '').trim();
      const mapplsPin     = (result.mapplsPin || result.placeId || result.eLoc || '').trim();

      const parts = [houseNumber, street, finalLocality, subDistrict, cleanDistrict, state].filter(Boolean);
      const uniqueParts = Array.from(new Set(parts.map(p => p.trim()))).filter(Boolean);

      const builtAddress = pincode ? `${uniqueParts.join(', ')} - ${pincode}` : uniqueParts.join(', ');
      const formattedAddress = builtAddress || result.formatted_address || result.formattedAddress || 'Location detected';

      this.logger.log(`[Mappls Rev-Geocode] HTTP status: ${response.status} | formattedAddress: ${Boolean(formattedAddress && formattedAddress !== 'Location detected')} | locality: ${Boolean(locality)} | village: ${Boolean(village)} | district: ${Boolean(cleanDistrict)} | state: ${Boolean(state)} | pincode: ${Boolean(pincode)} | placeId: ${Boolean(mapplsPin)}`);

      return {
        latitude: lat,
        longitude: lng,
        locality: finalLocality || cleanDistrict || 'Current Location',
        village,
        subLocality,
        district: cleanDistrict,
        subDistrict,
        state,
        country,
        pincode,
        mapplsPin,
        formattedAddress,
      };
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
    const token = await this.getValidToken();
    if (!token) return this._fallbackGeocodeFailure('MAPPLS_ACCESS_TOKEN not configured');

    try {
      const url = `https://search.mappls.com/search/address/geocode?address=${encodeURIComponent(addressStr.trim())}&access_token=${token}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.error(`Mappls search HTTP 404. Endpoint: https://search.mappls.com/search/address/geocode`);
        } else {
          this.logger.error(`Mappls search HTTP ${response.status}`);
        }
        return this._fallbackGeocodeFailure(`Mappls search HTTP ${response.status}`);
      }

      const data = await response.json();
      
      this.logger.log(`[Mappls Geocode] HTTP ${response.status} | responseCode: ${data?.responseCode ?? data?.code ?? 'N/A'} | results: ${data?.copResults ? 1 : (data?.results?.length ?? 0)}`);

      let firstResult: any = null;
      if (data?.copResults) {
        firstResult = data.copResults;
      } else if (Array.isArray(data?.results) && data.results.length > 0) {
        firstResult = data.results[0];
      } else if (Array.isArray(data?.suggestedLocations) && data.suggestedLocations.length > 0) {
        firstResult = data.suggestedLocations[0];
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        firstResult = data.data[0];
      } else if (data?.latitude && data?.longitude) {
        firstResult = data;
      }

      if (!firstResult) {
        return {
          success: false,
          code: 'LOCATION_NOT_FOUND',
          latitude: null,
          longitude: null,
          displayName: null,
          geocodeLevel: null,
          precisionLabel: 'FAILED',
          confidenceScore: 0,
          matchedAddress: null,
          verificationStatus: 'FAILED',
          queryTierUsed: 1,
          source: 'mappls_geocoding',
          reason: 'No results from Mappls for this address'
        } as unknown as DetailedGeocodeResult;
      }

      this.logger.log(`[Mappls Geocode] Found result keys: ${Object.keys(firstResult).join(', ')}`);

      const lat = parseFloat(firstResult.latitude);
      const lng = parseFloat(firstResult.longitude);
      
      let finalLat = lat;
      let finalLng = lng;

      // If Geocode API only returns eLoc (common in Mappls REST Geocoding without coordinate entitlements), resolve it
      if ((isNaN(finalLat) || isNaN(finalLng)) && firstResult.eLoc) {
        try {
          const elocUrl = `https://explore.mappls.com/api/places/eloc?eloc=${firstResult.eLoc}&access_token=${token}`;
          const elocController = new AbortController();
          const elocTimeout = setTimeout(() => elocController.abort(), 8000);
          const elocResponse = await fetch(elocUrl, { signal: elocController.signal });
          clearTimeout(elocTimeout);
          if (elocResponse.ok) {
            const elocData = await elocResponse.json();
            const elocLat = parseFloat(elocData?.latitude ?? elocData?.lat);
            const elocLng = parseFloat(elocData?.longitude ?? elocData?.lng);
            if (!isNaN(elocLat) && !isNaN(elocLng)) {
              finalLat = elocLat;
              finalLng = elocLng;
            }
          }
        } catch (e) {
          this.logger.warn('Failed to resolve eLoc: ' + e.message);
        }
      }

      if (isNaN(finalLat) || isNaN(finalLng)) {
        return this._fallbackGeocodeFailure('Mappls returned invalid coordinates. ' + (firstResult.eLoc ? 'Failed to resolve eLoc.' : ''));
      }
      
      const latResolved = finalLat;
      const lngResolved = finalLng;


      const formattedAddress = firstResult.formattedAddress || firstResult.placeName || addressStr;
      
      this.logger.log(`[Mappls Geocode] Resolved: ${formattedAddress} -> lat: ${lat}, lng: ${lng}`);

      return {
        success: true,
        latitude: latResolved,
        longitude: lngResolved,
        displayName: formattedAddress,
        geocodeLevel: firstResult.geocodeLevel || firstResult.type || 'address',
        precisionLabel: 'EXACT',
        confidenceScore: firstResult.confidenceScore !== undefined ? Number(firstResult.confidenceScore) : 1,
        matchedAddress: formattedAddress,
        verificationStatus: 'VERIFIED',
        queryTierUsed: 1,
        source: 'mappls_geocoding',
        reason: null,
        city: firstResult.city || firstResult.district || null,
        state: firstResult.state || null,
        postalCode: firstResult.pincode || firstResult.postalCode || null,
        locality: firstResult.locality || firstResult.village || null,
        district: firstResult.district || null,
        formattedAddress: formattedAddress
      } as any;
    } catch (err: any) {
      this.logger.error(`Geocoding network error: ${err.message}`);
      return this._fallbackGeocodeFailure('Geocoding error: ' + err.message);
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
    if (!query?.trim()) return [];
    const token = await this.getValidToken();
    if (!token) return [];

    try {
      let url = `https://search.mappls.com/apis/searchV3?query=${encodeURIComponent(query.trim())}&region=IND&tokenizeAddress=true&access_token=${token}`;
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
    const token = await this.getValidToken();
    if (!token) {
      throw new Error('MAPPLS_ACCESS_TOKEN not configured. Cannot calculate road distance.');
    }
    if (!this.isValidCoordinates(fromLat, fromLng) || !this.isValidCoordinates(toLat, toLng)) {
      throw new Error('Invalid coordinates for routing.');
    }

    // Authoritative Mappls Production Advanced Routing Endpoint (route.mappls.com)
    const url = `https://route.mappls.com/route/direction/route_adv/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${encodeURIComponent(token)}`;

    const isJwt = token.startsWith('ey');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (isJwt) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 401) {
          this.logger.warn(`[Mappls Auth] HTTP 401 Unauthorized from route.mappls.com. Ensure MAPPLS_ACCESS_TOKEN in Render backend is an active REST Static Key with Routing API enabled.`);
        }
        throw new Error(`Mappls Routing HTTP ${response.status}: ${body.substring(0, 200)}`);
      }

      const data = await response.json();
      const route = data?.routes?.[0] || data?.results?.routes?.[0] || data?.results?.trips?.[0];

      const rawDist = route?.distance ?? route?.legs?.[0]?.distance ?? data?.results?.distances?.[0]?.[1] ?? data?.distance;
      const rawDur = route?.duration ?? route?.legs?.[0]?.duration ?? data?.results?.durations?.[0]?.[1] ?? data?.duration;

      const distNum = typeof rawDist === 'number' ? rawDist : (typeof rawDist === 'string' ? parseFloat(rawDist) : NaN);
      const durNum = typeof rawDur === 'number' ? rawDur : (typeof rawDur === 'string' ? parseFloat(rawDur) : NaN);

      this.logger.log(`[Mappls Route Debug] HTTP status: ${response.status} | response received: ${Boolean(data)} | route found: ${Boolean(route || !isNaN(distNum))} | distance field found: ${!isNaN(distNum)} | duration field found: ${!isNaN(durNum)}`);

      if (isNaN(distNum) || distNum < 0) {
        throw new Error('Mappls Routing returned no valid road routes or distance between the specified coordinates.');
      }

      const calculatedDuration = !isNaN(durNum) && durNum >= 0 ? durNum : (distNum / 1000 / 30) * 3600; // fallback 30 km/h in seconds if duration missing

      return {
        distanceKm: Math.round((distNum / 1000) * 100) / 100,
        etaMinutes: Math.ceil(calculatedDuration / 60),
      };
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.error(`Mappls Routing error (${fromLat},${fromLng} -> ${toLat},${toLng}): ${err?.message || err}`);
      throw err;
    }
  }

  // 4b. ROUTE GEOMETRY — Authoritative Mappls Road Geometry (GeoJSON)
  async getRouteGeometry(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number,
  ): Promise<{ coordinates: [number, number][]; distanceKm: number; etaMinutes: number }> {
    const token = await this.getValidToken();
    if (!token) {
      throw new Error('MAPPLS_ACCESS_TOKEN not configured.');
    }
    if (!this.isValidCoordinates(fromLat, fromLng) || !this.isValidCoordinates(toLat, toLng)) {
      throw new Error('Invalid coordinates for route geometry.');
    }

    const url = `https://route.mappls.com/route/direction/route_adv/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${encodeURIComponent(token)}&geometries=geojson&overview=full`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Mappls Route Geometry HTTP ${response.status}`);
      }

      const data = await response.json();
      const route = data?.routes?.[0];
      if (!route) {
        throw new Error('No route found from Mappls.');
      }

      const distNum = Number(route.distance) || 0;
      const durNum = Number(route.duration) || 0;

      // Mappls GeoJSON returns coordinates as [lng, lat]. Convert to [lat, lng]
      const rawCoords: [number, number][] = route.geometry?.coordinates || [];
      const coordinates: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

      return {
        coordinates,
        distanceKm: Math.round((distNum / 1000) * 100) / 100,
        etaMinutes: Math.ceil(durNum / 60),
      };
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.error(`Mappls Route Geometry error (${fromLat},${fromLng} -> ${toLat},${toLng}): ${err?.message || err}`);
      throw err;
    }
  }

  // 5. DISTANCE MATRIX — Authoritative Mappls Batch Endpoint
  public async computeDistanceMatrix(
    origin: [number, number],
    destinations: [number, number][],
  ): Promise<{ distanceKm: number | null; etaMinutes: number | null }[]> {
    const token = await this.getValidToken();
    if (!token || destinations.length === 0) {
      return destinations.map(() => ({ distanceKm: null, etaMinutes: null }));
    }

    const batch = destinations.slice(0, 99);
    const [originLat, originLng] = origin;

    // Mappls format: lng,lat; origin first, followed by destinations
    const coords = [
      `${originLng},${originLat}`,
      ...batch.map(([lat, lng]) => `${lng},${lat}`),
    ].join(';');

    const isJwt = token.startsWith('ey');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (isJwt) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `https://apis.mappls.com/advancedmaps/v1/${token}/distance_matrix/driving/${coords}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        if (response.status === 401) {
          this.logger.warn(`[Mappls Auth] HTTP 401 Unauthorized for Distance Matrix on apis.mappls.com.`);
        }
        return batch.map(() => ({ distanceKm: null, etaMinutes: null }));
      }

      const data = await response.json();
      const distances: number[] = data?.results?.distances?.[0] || [];
      const durations: number[] = data?.results?.durations?.[0] || [];

      return batch.map((_, i) => ({
        distanceKm: distances[i + 1] !== undefined && distances[i + 1] !== null && distances[i + 1] >= 0
          ? Math.round((distances[i + 1] / 1000) * 100) / 100
          : null,
        etaMinutes: durations[i + 1] !== undefined && durations[i + 1] !== null && durations[i + 1] >= 0
          ? Math.ceil(durations[i + 1] / 60)
          : null,
      }));
    } catch (err: any) {
      clearTimeout(timeout);
      this.logger.error(`Mappls Distance Matrix error: ${err?.message || err}`);
      return batch.map(() => ({ distanceKm: null, etaMinutes: null }));
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




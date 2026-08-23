import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';

/** Haversine formula — returns straight-line distance in kilometres for preliminary filtering */
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

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);
  private readonly mapsClient: Client;

  constructor(private readonly prisma: PrismaService) {
    this.mapsClient = new Client({});
  }

  private get GoogleKey(): string {
    return process.env.GOOGLE_MAPS_SERVER_API_KEY || '';
  }

  /** Forward Geocode using Google Geocoding API */
  async geocodeStructuredAddress(addr: StructuredAddressQuery): Promise<DetailedGeocodeResult> {
    if (!this.GoogleKey) {
      this.logger.warn('GOOGLE_MAPS_SERVER_API_KEY is not configured');
      return this._fallbackGeocodeFailure('Missing API Key');
    }

    const queryParts = [
      addr.houseNumber,
      addr.street,
      addr.areaLocality,
      addr.landmark,
      addr.city,
      addr.state,
      addr.postalCode,
      'India'
    ].filter(Boolean);

    const addressString = queryParts.join(', ').replace(/,+/g, ',').trim();

    try {
      const response = await this.mapsClient.geocode({
        params: {
          address: addressString,
          key: this.GoogleKey,
          region: 'in',
        },
        timeout: 5000,
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
          success: true,
          latitude: location.lat,
          longitude: location.lng,
          displayName: result.formatted_address,
          geocodeLevel: result.types[0] || 'unknown',
          precisionLabel: result.geometry.location_type === 'ROOFTOP' ? 'EXACT' : 'AREA',
          confidenceScore: 1.0,
          matchedAddress: result.formatted_address,
          verificationStatus: 'VERIFIED',
          queryTierUsed: 1,
          source: 'google_geocoding',
        };
      }
    } catch (error: any) {
      this.logger.error(`Geocoding error: ${error.message}`);
    }

    return this._fallbackGeocodeFailure('Unable to geocode address via Google Maps');
  }

  private _fallbackGeocodeFailure(reason: string): DetailedGeocodeResult {
    return {
      success: false,
      latitude: null,
      longitude: null,
      displayName: null,
      geocodeLevel: null,
      precisionLabel: 'UNKNOWN',
      confidenceScore: 0,
      matchedAddress: null,
      verificationStatus: 'FAILED',
      queryTierUsed: 0,
      source: 'google_geocoding',
      reason,
    };
  }

  /** Reverse Geocode using Google Geocoding API */
  async resolveLocation(lat: number, lng: number): Promise<{
    latitude: number;
    longitude: number;
    locality: string;
    district: string;
    subDistrict?: string;
    state: string;
    country: string;
    formattedAddress: string;
  }> {
    const fallback = {
      latitude: lat,
      longitude: lng,
      locality: '',
      district: '',
      state: '',
      country: 'India',
      formattedAddress: 'Unknown Location',
    };

    if (!this.GoogleKey) return fallback;

    try {
      const response = await this.mapsClient.reverseGeocode({
        params: {
          latlng: [lat, lng],
          key: this.GoogleKey,
        },
        timeout: 5000,
      });

      if (response.data.results && response.data.results.length > 0) {
        // Find a rooftop or the most specific address
        const bestMatch = response.data.results[0];
        let locality = '';
        let district = '';
        let state = '';
        let country = 'India';

        for (const component of bestMatch.address_components) {
          if (component.types.includes('locality' as any)) {
            locality = component.long_name;
          } else if (component.types.includes('administrative_area_level_3' as any)) {
            locality = locality || component.long_name;
          }
          if (component.types.includes('administrative_area_level_2' as any)) {
            district = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1' as any)) {
            state = component.long_name;
          }
          if (component.types.includes('country' as any)) {
            country = component.long_name;
          }
        }

        return {
          latitude: lat,
          longitude: lng,
          locality,
          district,
          state,
          country,
          formattedAddress: bestMatch.formatted_address,
        };
      }
    } catch (error: any) {
      this.logger.error(`Reverse geocoding error: ${error.message}`);
    }

    return fallback;
  }

  /** Reverse geocoding returns only formatted string */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const resolved = await this.resolveLocation(lat, lng);
    return resolved.formattedAddress;
  }

  /** 
   * Calculate distance and ETA between two coordinates using Google Routes API / Distance Matrix API.
   * If Google Routes fails, falls back to Haversine.
   */
  async calculateDistanceAndEta(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number,
  ): Promise<DistanceResult> {
    if (this.GoogleKey) {
      try {
        const response = await this.mapsClient.distancematrix({
          params: {
            origins: [[fromLat, fromLng]],
            destinations: [[toLat, toLng]],
            key: this.GoogleKey,
            mode: TravelMode.driving,
          },
          timeout: 3000,
        });

        const element = response.data.rows[0]?.elements[0];
        if (element && element.status === 'OK') {
          return {
            distanceKm: Math.round((element.distance.value / 1000) * 100) / 100, // meters to km
            etaMinutes: Math.ceil(element.duration.value / 60), // seconds to minutes
          };
        }
      } catch (err: any) {
        this.logger.error(`Google DistanceMatrix Error: ${err.message}`);
      }
    }

    // Fallback to Haversine
    const distanceKm = haversineKm(fromLat, fromLng, toLat, toLng);
    const etaMinutes = Math.ceil((distanceKm / 20) * 60); // Assuming 20 km/h average
    return { distanceKm: Math.round(distanceKm * 100) / 100, etaMinutes };
  }

  /** 
   * Two-stage discovery:
   * 1. Haversine filtering (fast, cheap) to find restaurants within radius.
   * 2. (Optional) Route Matrix for actual road distances.
   */
  async getNearbyRestaurants(
    lat:      number,
    lng:      number,
    radiusKm: number = 5,
  ): Promise<NearbyRestaurant[]> {
    const delta = radiusKm / 111;

    // Stage 1: Preliminary geographic filtering
    const candidates = await this.prisma.restaurant.findMany({
      where: {
        status:   'APPROVED',
        isOpen:   true,
        latitude:  { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
        deletedAt: null,
      },
      take: 20, // Limit candidates
    });

    const nearby: NearbyRestaurant[] = [];

    for (const rest of candidates) {
      const hDist = haversineKm(lat, lng, rest.latitude, rest.longitude);
      if (hDist <= radiusKm) {
        nearby.push({
          id: rest.id,
          name: rest.name,
          slug: rest.slug,
          avgRating: rest.avgRating ? Number(rest.avgRating) : 0,
          distanceKm: Math.round(hDist * 100) / 100,
          etaMinutes: Math.ceil((hDist / 20) * 60) + 10, // 10 min prep time avg
          lat: rest.latitude,
          lng: rest.longitude,
        });
      }
    }

    return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /** Find available drivers (Internal - uses simple Haversine) */
  async getNearbyDrivers(
    lat: number,
    lng: number,
  ): Promise<any[]> {
    const drivers = await this.prisma.driver.findMany({
      where: {
        status: 'ONLINE',
      },
    });

    return drivers.map(d => ({
      ...d,
      distanceKm: haversineKm(lat, lng, d.currentLat || 0, d.currentLng || 0),
    })).filter(d => d.distanceKm <= 10).sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /** Validate delivery radius using actual Google Maps Routes/Distance */
  async validateDeliveryRadius(
    restaurantId: string,
    deliveryLat:  number,
    deliveryLng:  number,
  ): Promise<{ valid: boolean; distanceKm: number; radiusKm: number }> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID "${restaurantId}" not found`);
    }

    // Two-stage filtering: Haversine first for quick rejection
    const hDist = haversineKm(restaurant.latitude, restaurant.longitude, deliveryLat, deliveryLng);
    if (hDist > restaurant.deliveryRadius * 1.5) { // Reject definitely outside
      return {
        valid: false,
        distanceKm: Math.round(hDist * 100) / 100,
        radiusKm: restaurant.deliveryRadius,
      };
    }

    // Call Google Routes/Distance API for actual road distance
    const roadRoute = await this.calculateDistanceAndEta(
      restaurant.latitude, restaurant.longitude,
      deliveryLat, deliveryLng,
    );

    const valid = roadRoute.distanceKm <= restaurant.deliveryRadius;

    return {
      valid,
      distanceKm: roadRoute.distanceKm,
      radiusKm: restaurant.deliveryRadius,
    };
  }

  // Deprecated/Stubbed methods for frontend migration
  async searchPlaceByName(placeName: string): Promise<any[]> {
    return []; // Handled by Frontend Google Places Autocomplete
  }

  async getAutosuggest(query: string): Promise<any[]> {
    return []; // Handled by Frontend Google Places Autocomplete
  }
}

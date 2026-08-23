import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
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
  private mapsClient: Client;

  // Read backend API key which should be restricted to Geocoding + Routes APIs
  private get GoogleKey(): string {
    return process.env.GOOGLE_MAPS_SERVER_API_KEY || '';
  }

  constructor(private readonly prisma: PrismaService) {
    this.mapsClient = new Client({});
  }

  /** Forward Geocode using Google Geocoding API */
  async geocodeAddress(addressStr: string): Promise<DetailedGeocodeResult> {
    if (!this.GoogleKey) {
      return this._fallbackGeocodeFailure('Google Maps API key not configured');
    }

    try {
      const response = await this.mapsClient.geocode({
        params: {
          address: addressStr,
          key: this.GoogleKey,
          region: 'in', // Bias towards India
        },
        timeout: 5000,
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        return {
          success: true,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          displayName: result.formatted_address,
          geocodeLevel: result.types[0] || 'unknown',
          precisionLabel: result.geometry.location_type,
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
      params.houseNumber,
      params.street,
      params.areaLocality,
      params.landmark,
      params.city,
      params.state,
      params.postalCode,
      params.country || 'India',
    ].filter(Boolean);
    const addressStr = parts.join(', ');
    return this.geocodeAddress(addressStr);
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
   * Calculate exact road distance and ETA between two coordinates using Google Routes API / Distance Matrix API.
   * STRICT ENFORCEMENT: No Haversine fallback. 
   */
  async calculateDistanceAndEta(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number,
  ): Promise<DistanceResult> {
    if (!this.GoogleKey) {
      throw new Error('Google Maps API key is not configured. Cannot calculate accurate road distance.');
    }

    try {
      const responseData = await this.computeRouteMatrix([[fromLat, fromLng]], [[toLat, toLng]]);
      const routeData = responseData.find((r: any) => r.originIndex === 0 && r.destinationIndex === 0);
      if (routeData && (routeData.condition === "ROUTE_EXISTS" || routeData.distanceMeters !== undefined)) {
        let etaMins = 0;
        if (routeData.duration) {
          etaMins = Math.ceil(parseInt(routeData.duration) / 60);
        }
        return {
          distanceKm: Math.round((routeData.distanceMeters / 1000) * 100) / 100,
          etaMinutes: etaMins
        };
      } else {
        throw new Error("Google Routes API returned no valid route (status: " + routeData?.condition + ")");
      }
    } catch (err: any) {
      this.logger.error("Google Routes Error: " + err.message);
      throw new Error('Failed to calculate road distance via Google Maps');
    }
  }

  /** 
   * Restaurant discovery:
   * 1. DB-level geographic bounding box (NOT haversine).
   * 2. Google Distance Matrix batch call for true road distances.
   */
  async getNearbyRestaurants(
    lat:      number,
    lng:      number,
    radiusKm: number = 5,
  ): Promise<NearbyRestaurant[]> {
    // 0.1 degree is roughly ~11km. This is just a bounding box to avoid loading the entire database.
    const delta = 0.2; 
    const candidates = await this.prisma.restaurant.findMany({
      where: {
        status:   'APPROVED',
        isOpen:   true,
        latitude:  { gte: lat - delta, lte: lat + delta },
        longitude: { gte: lng - delta, lte: lng + delta },
        deletedAt: null,
      },
      take: 25, // Limit to 25 to respect Distance Matrix standard maximum destinations
    });

    if (candidates.length === 0) return [];
    if (!this.GoogleKey) return [];

    const nearby: NearbyRestaurant[] = [];
    const origins = [[lat, lng]] as [number, number][];
    const destinations = candidates.map(c => [c.latitude, c.longitude] as [number, number]);

    try {
      const responseData = await this.computeRouteMatrix(origins, destinations);
      candidates.forEach((rest, index) => {
        const routeData = responseData.find((r: any) => r.originIndex === 0 && r.destinationIndex === index);
        if (routeData && (routeData.condition === "ROUTE_EXISTS" || routeData.distanceMeters !== undefined)) {
          const distanceKm = Math.round((routeData.distanceMeters / 1000) * 100) / 100;
          if (distanceKm <= radiusKm) {
            let etaMins = 0;
            if (routeData.duration) {
              etaMins = Math.ceil(parseInt(routeData.duration) / 60);
            }
            nearby.push({
              id: rest.id,
              name: rest.name,
              slug: rest.slug,
              avgRating: rest.avgRating ? Number(rest.avgRating) : 0,
              distanceKm,
              etaMinutes: etaMins + 10,
              lat: rest.latitude,
              lng: rest.longitude,
            });
          }
        }
      });
    } catch (err: any) {
      this.logger.error("Batch Google Routes Error: " + err.message);
    }

    return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /** Find available drivers using true road distance */
  async getNearbyDrivers(
    lat: number,
    lng: number,
  ): Promise<any[]> {
    const delta = 0.2;
    const drivers = await this.prisma.driver.findMany({
      where: {
        status: 'ONLINE',
        currentLat: { gte: lat - delta, lte: lat + delta },
        currentLng: { gte: lng - delta, lte: lng + delta },
      },
      take: 25,
    });

    if (drivers.length === 0 || !this.GoogleKey) return [];

    const origins = drivers.map(d => [d.currentLat!, d.currentLng!] as [number, number]);
    const destinations = [[lat, lng]] as [number, number][];

    const nearbyDrivers: any[] = [];
    try {
      const responseData = await this.computeRouteMatrix(origins, destinations);
      drivers.forEach((driver, index) => {
        const routeData = responseData.find((r: any) => r.originIndex === index && r.destinationIndex === 0);
        if (routeData && (routeData.condition === "ROUTE_EXISTS" || routeData.distanceMeters !== undefined)) {
          const distanceKm = Math.round((routeData.distanceMeters / 1000) * 100) / 100;
          if (distanceKm <= 10) {
            let etaMins = 0;
            if (routeData.duration) {
              etaMins = Math.ceil(parseInt(routeData.duration) / 60);
            }
            nearbyDrivers.push({
              ...driver,
              distanceKm,
              etaMinutes: etaMins,
            });
          }
        }
      });
    } catch (err: any) {
      this.logger.error("Driver Batch Google Routes Error: " + err.message);
    }

    return nearbyDrivers.sort((a, b) => a.distanceKm - b.distanceKm);
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

    // STRICT: Call Google Routes/Distance API for actual road distance (NO HAVERSINE)
    try {
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
    } catch (error) {
      // If we cannot verify road distance, delivery is unavailable
      return {
        valid: false,
        distanceKm: 999,
        radiusKm: restaurant.deliveryRadius,
      };
    }
  }

  // Deprecated/Stubbed methods for frontend migration
  async searchPlaceByName(placeName: string): Promise<any[]> {
    return []; // Handled by Frontend Google Places Autocomplete
  }

  async getAutosuggest(query: string): Promise<any[]> {
    return []; // Handled by Frontend Google Places Autocomplete
  }

  private async computeRouteMatrix(origins: [number, number][], destinations: [number, number][]) {
    const url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
    const body = {
      origins: origins.map(([lat, lng]) => ({ waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } })),
      destinations: destinations.map(([lat, lng]) => ({ waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } })),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE"
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.GoogleKey || "",
        "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,status,condition"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Routes API failed: ${response.status} ${text}`);
    }
    return await response.json();
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeolocationService } from './geolocation.service';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryDistanceResult {
  valid: boolean;
  distanceKm: number;
  radiusKm: number;
  distanceType: 'MAPPLS_ROAD_ROUTING';
  reason?: string;
}

@Injectable()
export class DistanceService {
  private readonly logger = new Logger(DistanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeolocationService
  ) {}

  /**
   * Validates coordinate values to ensure they are valid non-zero geographic numbers.
   */
  validateCoordinates(lat?: number | null, lng?: number | null): boolean {
    if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat === 0 && lng === 0) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  }

  /**
   * Authoritative Delivery Distance Calculation (Point A: Restaurant -> Point B: Verified Customer Address)
   * Exclusively uses Mappls Routing / Distance Matrix (No Haversine).
   */
  async getDeliveryDistance(
    restaurantId: string,
    customerLat: number,
    customerLng: number,
  ): Promise<DeliveryDistanceResult> {
    if (!this.validateCoordinates(customerLat, customerLng)) {
      return {
        valid: false,
        distanceKm: 999, // Should really throw
        radiusKm: 0,
        distanceType: 'MAPPLS_ROAD_ROUTING',
        reason: 'INVALID_CUSTOMER_COORDINATES',
      };
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || !this.validateCoordinates(restaurant.latitude, restaurant.longitude)) {
      return {
        valid: false,
        distanceKm: 999, // Should really throw
        radiusKm: 0,
        distanceType: 'MAPPLS_ROAD_ROUTING',
        reason: 'INVALID_RESTAURANT_COORDINATES',
      };
    }

    const radiusKm = Number(restaurant.deliveryRadius || 15.0);

    try {
      const { distanceKm } = await this.geoService.calculateDistanceAndEta(
        restaurant.latitude,
        restaurant.longitude,
        customerLat,
        customerLng,
      );

      const valid = distanceKm <= radiusKm;

      return {
        valid,
        distanceKm,
        radiusKm,
        distanceType: 'MAPPLS_ROAD_ROUTING',
        reason: valid ? undefined : 'OUTSIDE_DELIVERY_RADIUS',
      };
    } catch (error) {
      return { valid: false, distanceKm: -1, radiusKm, distanceType: 'MAPPLS_ROAD_ROUTING', reason: 'ROUTE_CALCULATION_FAILED' };
    }
  }
}


import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DeliveryDistanceResult {
  valid: boolean;
  distanceKm: number;
  radiusKm: number;
  distanceType: 'HAVERSINE' | 'ROAD_ROUTING';
  reason?: string;
}

/** Haversine formula — returns straight-line distance in kilometres */
export function calculateHaversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class DistanceService {
  private readonly logger = new Logger(DistanceService.name);

  constructor(private readonly prisma: PrismaService) {}

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
   */
  async getDeliveryDistance(
    restaurantId: string,
    customerLat: number,
    customerLng: number,
  ): Promise<DeliveryDistanceResult> {
    if (!this.validateCoordinates(customerLat, customerLng)) {
      return {
        valid: false,
        distanceKm: 0,
        radiusKm: 0,
        distanceType: 'HAVERSINE',
        reason: 'INVALID_CUSTOMER_COORDINATES',
      };
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || !this.validateCoordinates(restaurant.latitude, restaurant.longitude)) {
      return {
        valid: false,
        distanceKm: 0,
        radiusKm: 0,
        distanceType: 'HAVERSINE',
        reason: 'INVALID_RESTAURANT_COORDINATES',
      };
    }

    const distanceKm = calculateHaversineDistance(
      restaurant.latitude,
      restaurant.longitude,
      customerLat,
      customerLng,
    );

    const roundedDistance = Math.round(distanceKm * 100) / 100;
    const radiusKm = Number(restaurant.deliveryRadius || 15.0);
    const valid = roundedDistance <= radiusKm;

    return {
      valid,
      distanceKm: roundedDistance,
      radiusKm,
      distanceType: 'HAVERSINE',
      reason: valid ? undefined : 'OUTSIDE_DELIVERY_RADIUS',
    };
  }
}

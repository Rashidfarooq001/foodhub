import { Test, TestingModule } from '@nestjs/testing';
import { GeolocationService } from './geolocation.service';
import { PrismaService } from '../database/prisma.service';

describe('GeolocationService', () => {
  let service: GeolocationService;

  const mockPrisma = {
    restaurant: {
      findMany: jest.fn().mockResolvedValue([]),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        latitude:      12.9716,
        longitude:     77.5946,
        deliveryRadius: 5.0,
      }),
    },
    driver: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeolocationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GeolocationService>(GeolocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDistanceAndEta', () => {
    it('should return approx 343 km for London to Paris', () => {
      const { distanceKm, etaMinutes } = service.calculateDistanceAndEta(
        51.5074, -0.1278,   // London
        48.8566,  2.3522,   // Paris
      );
      expect(distanceKm).toBeGreaterThan(330);
      expect(distanceKm).toBeLessThan(360);
      expect(etaMinutes).toBeGreaterThan(0);
    });

    it('should return ~0 km for same coordinates', () => {
      const { distanceKm } = service.calculateDistanceAndEta(12.9716, 77.5946, 12.9716, 77.5946);
      expect(distanceKm).toBe(0);
    });

    it('should return ~10 km for Bangalore centre to 10km north', () => {
      const { distanceKm } = service.calculateDistanceAndEta(
        12.9716, 77.5946,   // Bangalore MG Road
        13.0627, 77.5946,   // ~10 km north
      );
      expect(distanceKm).toBeGreaterThan(9);
      expect(distanceKm).toBeLessThan(11);
    });
  });

  describe('validateDeliveryRadius', () => {
    it('should return valid=true for location within 5km radius', async () => {
      const result = await service.validateDeliveryRadius(
        'rest-1',
        12.9800, // ~1km from 12.9716
        77.5946,
      );
      expect(result.valid).toBe(true);
    });

    it('should return valid=false for location > 5km away', async () => {
      const result = await service.validateDeliveryRadius(
        'rest-1',
        13.1000, // ~14km north
        77.5946,
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('getNearbyRestaurants', () => {
    it('should return empty array when no restaurants in DB', async () => {
      const results = await service.getNearbyRestaurants(12.9716, 77.5946, 5);
      expect(results).toHaveLength(0);
    });
  });
});

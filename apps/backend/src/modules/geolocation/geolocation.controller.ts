import {
  Controller, Get, Post, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GeolocationService } from './geolocation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class ValidateRadiusDto {
  @IsNumber() @Type(() => Number) restaurantId!: string;
  @IsNumber() @Type(() => Number) deliveryLat!:  number;
  @IsNumber() @Type(() => Number) deliveryLng!:  number;
}

@ApiTags('Geolocation (Phase 14)')
@Controller(['geolocation', 'geo'])
export class GeolocationController {
  constructor(private readonly geo: GeolocationService) {}

  @Get(['search-place', 'place-search'])
  @ApiOperation({ summary: 'Place-Name location search (e.g. Kehnusa, Aloosa, Sopore, Bandipora)' })
  @ApiQuery({ name: 'q', required: false, description: 'Place search query' })
  @ApiQuery({ name: 'query', required: false, description: 'Place search query' })
  async searchPlace(
    @Query('q') q?: string,
    @Query('query') query?: string,
  ) {
    const searchTerm = query || q || '';
    if (!searchTerm.trim()) return { places: [] };
    const places = await this.geo.searchPlaceByName(searchTerm.trim());
    return { places };
  }

  @Get(['autosuggest', 'search'])
  @ApiOperation({ summary: 'Mappls Location Autosuggest & Search API' })
  @ApiQuery({ name: 'q', required: false, description: 'Address search query' })
  @ApiQuery({ name: 'query', required: false, description: 'Address search query' })
  async searchAddress(
    @Query('q') q?: string,
    @Query('query') query?: string,
  ) {
    const searchTerm = query || q || '';
    if (!searchTerm.trim()) return { suggestions: [] };
    return this.geo.getAutosuggest(searchTerm.trim());
  }

  @Get(['geocode', 'forward'])
  @ApiOperation({ summary: 'Forward geocode complete text address to latitude & longitude' })
  @ApiQuery({ name: 'address', required: false, description: 'Complete address query' })
  @ApiQuery({ name: 'houseNumber', required: false })
  @ApiQuery({ name: 'areaLocality', required: false })
  @ApiQuery({ name: 'landmark', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'postalCode', required: false })
  async geocodeAddress(
    @Query('address') address?: string,
    @Query('houseNumber') houseNumber?: string,
    @Query('areaLocality') areaLocality?: string,
    @Query('landmark') landmark?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('postalCode') postalCode?: string,
  ) {
    const res = await this.geo.geocodeStructuredAddress({
      houseNumber,
      areaLocality: areaLocality || address,
      landmark,
      city,
      state,
      postalCode,
    });
    if (res.success) {
      return res;
    }
    return { success: false, message: "Couldn't determine the location of this address." };
  }

  @Post(['forward-geocode', 'geocode', 'forward'])
  @ApiOperation({ summary: 'POST forward geocode structured address (Zomato-Style)' })
  async postGeocodeAddress(@Body() body: {
    house?: string;
    houseNumber?: string;
    street?: string;
    area?: string;
    areaLocality?: string;
    landmark?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    pincode?: string;
    address?: string;
  }) {
    const houseNumber = body.house || body.houseNumber;
    const areaLocality = body.area || body.areaLocality || body.address;
    const postalCode = body.postalCode || body.pincode;

    const res = await this.geo.geocodeStructuredAddress({
      houseNumber,
      street: body.street,
      areaLocality,
      landmark: body.landmark,
      city: body.city,
      state: body.state,
      postalCode,
    });

    return {
      success: res.success,
      location: res.success && res.latitude && res.longitude ? {
        latitude: res.latitude,
        longitude: res.longitude,
      } : null,
      verification: {
        status: res.verificationStatus,
        provider: 'MAPPLS',
        confidence: res.confidenceScore,
                                      },
      message: res.reason || (res.success ? 'Address location verified successfully' : "Couldn't determine the location of this address."),
      formattedAddress: res.displayName,
      latitude: res.latitude,
      longitude: res.longitude,
      verificationStatus: res.verificationStatus,
    };
  }

  @Post(['resolve', 'location/resolve'])
  @ApiOperation({ summary: 'Resolve customer GPS coordinates into structured Zayka Food location' })
  async postResolveLocation(
    @Body() body: { latitude?: number; longitude?: number; lat?: number; lng?: number },
  ) {
    const lat = body.latitude ?? body.lat ?? 0;
    const lng = body.longitude ?? body.lng ?? 0;
    return this.geo.resolveLocation(Number(lat), Number(lng));
  }

  @Get(['resolve', 'location/resolve'])
  @ApiOperation({ summary: 'GET Resolve customer GPS coordinates into structured Zayka Food location' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  async getResolveLocation(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.geo.resolveLocation(parseFloat(lat || '0'), parseFloat(lng || '0'));
  }

  @Get(['reverse', 'reverse-geocode'])
  @ApiOperation({ summary: 'Reverse geocode coordinates to address' })
  @ApiQuery({ name: 'lat' })
  @ApiQuery({ name: 'lng' })
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const result = await this.geo.resolveLocation(parseFloat(lat || '0'), parseFloat(lng || '0'));
    return result;
  }

  @Get('distance')
  @ApiOperation({ summary: 'Calculate distance and ETA between two coordinates' })
  @ApiQuery({ name: 'fromLat' }) @ApiQuery({ name: 'fromLng' })
  @ApiQuery({ name: 'toLat' })  @ApiQuery({ name: 'toLng' })
  distance(
    @Query('fromLat') fromLat: string,
    @Query('fromLng') fromLng: string,
    @Query('toLat')   toLat:   string,
    @Query('toLng')   toLng:   string,
  ) {
    return this.geo.calculateDistanceAndEta(
      parseFloat(fromLat), parseFloat(fromLng),
      parseFloat(toLat),   parseFloat(toLng),
    );
  }

  @Get('nearby-restaurants')
  @ApiOperation({ summary: 'Find restaurants near a location (sorted by distance)' })
  @ApiQuery({ name: 'lat' })
  @ApiQuery({ name: 'lng' })
  @ApiQuery({ name: 'radius', required: false, description: 'km (default 5)' })
  async nearbyRestaurants(
    @Query('lat')    lat:    string,
    @Query('lng')    lng:    string,
    @Query('radius') radius: string = '5',
  ) {
    return this.geo.getNearbyRestaurants(
      parseFloat(lat), parseFloat(lng), parseFloat(radius),
    );
  }

  @Get('nearby-drivers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find available drivers near a location (admin/internal)' })
  @ApiQuery({ name: 'lat' })
  @ApiQuery({ name: 'lng' })
  async nearbyDrivers(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.geo.getNearbyDrivers(parseFloat(lat), parseFloat(lng));
  }

  @Post('validate-radius')
  @ApiOperation({ summary: 'Validate delivery address is within restaurant delivery radius' })
  async validateRadius(
    @Body() body: { restaurantId: string; deliveryLat: number; deliveryLng: number },
  ) {
    return this.geo.validateDeliveryRadius(
      body.restaurantId, body.deliveryLat, body.deliveryLng,
    );
  }
}

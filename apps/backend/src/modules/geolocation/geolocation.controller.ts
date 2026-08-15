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

  @Post(['geocode', 'forward'])
  @ApiOperation({ summary: 'POST forward geocode structured address' })
  async postGeocodeAddress(@Body() body: {
    houseNumber?: string;
    street?: string;
    areaLocality?: string;
    landmark?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    address?: string;
  }) {
    return this.geo.geocodeStructuredAddress({
      houseNumber: body.houseNumber,
      street: body.street,
      areaLocality: body.areaLocality || body.address,
      landmark: body.landmark,
      city: body.city,
      state: body.state,
      postalCode: body.postalCode,
    });
  }

  @Get(['reverse', 'reverse-geocode'])
  @ApiOperation({ summary: 'Reverse geocode coordinates to address' })
  @ApiQuery({ name: 'lat' })
  @ApiQuery({ name: 'lng' })
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const address = await this.geo.reverseGeocode(parseFloat(lat), parseFloat(lng));
    return typeof address === 'string' ? { address } : address;
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

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
@Controller('api/v1/geo')
export class GeolocationController {
  constructor(private readonly geo: GeolocationService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search address via OpenStreetMap Nominatim' })
  @ApiQuery({ name: 'q', description: 'Address search query' })
  async searchAddress(@Query('q') q: string) {
    return this.geo.searchAddress(q);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates to address' })
  @ApiQuery({ name: 'lat' })
  @ApiQuery({ name: 'lng' })
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const address = await this.geo.reverseGeocode(parseFloat(lat), parseFloat(lng));
    return { address };
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

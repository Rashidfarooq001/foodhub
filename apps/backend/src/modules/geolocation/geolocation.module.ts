import { Module } from '@nestjs/common';
import { GeolocationController } from './geolocation.controller';
import { GeolocationService } from './geolocation.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports:     [DatabaseModule],
  controllers: [GeolocationController],
  providers:   [GeolocationService],
  exports:     [GeolocationService],
})
export class GeolocationModule {}

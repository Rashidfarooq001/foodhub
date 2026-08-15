import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { UnitEconomicsService } from './unit-economics.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PricingController],
  providers: [PricingService, UnitEconomicsService],
  exports: [PricingService, UnitEconomicsService],
})
export class PricingModule {}

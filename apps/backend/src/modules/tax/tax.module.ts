import { Module } from '@nestjs/common';
import { TaxController } from './tax.controller';
import { TaxEngineService } from './tax-engine.service';
import { OrderQuoteService } from './order-quote.service';
import { DatabaseModule } from '../database/database.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [DatabaseModule, PricingModule],
  controllers: [TaxController],
  providers: [TaxEngineService, OrderQuoteService],
  exports: [TaxEngineService, OrderQuoteService],
})
export class TaxModule {}

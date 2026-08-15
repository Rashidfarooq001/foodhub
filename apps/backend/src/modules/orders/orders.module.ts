import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { TaxModule } from '../tax/tax.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports:     [TaxModule, PricingModule],
  controllers: [OrdersController],
  providers:   [
    OrdersService,
    OrdersRepository,
    OrdersValidationService,
    OrdersGateway,
  ],
  exports:     [OrdersService, OrdersGateway],
})
export class OrdersModule {}

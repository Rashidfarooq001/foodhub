import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { OrderStateMachineService } from './order-state-machine.service';
import { OrderLifecycleService } from './order-lifecycle.service';
import { TaxModule } from '../tax/tax.module';
import { PricingModule } from '../pricing/pricing.module';

import { DatabaseModule } from '../database/database.module';
import { TokensModule } from '../tokens/tokens.module';
import { GeolocationModule } from '../geolocation/geolocation.module';

@Module({
  imports:     [TaxModule, PricingModule, DatabaseModule, TokensModule, GeolocationModule],
  controllers: [OrdersController],
  providers:   [
    OrdersService,
    OrdersRepository,
    OrdersValidationService,
    OrdersGateway,
    OrderStateMachineService,
    OrderLifecycleService,
  ],
  exports:     [OrdersService, OrdersGateway, OrderStateMachineService, OrderLifecycleService],
})
export class OrdersModule {}

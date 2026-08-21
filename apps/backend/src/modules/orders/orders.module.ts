import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { OrderStateMachineService } from './order-state-machine.service';
import { TaxModule } from '../tax/tax.module';
import { PricingModule } from '../pricing/pricing.module';

import { DatabaseModule } from '../database/database.module';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports:     [TaxModule, PricingModule, DatabaseModule, TokensModule],
  controllers: [OrdersController],
  providers:   [
    OrdersService,
    OrdersRepository,
    OrdersValidationService,
    OrdersGateway,
    OrderStateMachineService,
  ],
  exports:     [OrdersService, OrdersGateway, OrderStateMachineService],
})
export class OrdersModule {}

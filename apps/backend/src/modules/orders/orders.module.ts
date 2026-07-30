import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports:     [DatabaseModule],
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

import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { DeliveryJobsController } from './delivery-jobs.controller';
import { DriversService } from './drivers.service';
import { DatabaseModule } from '../database/database.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [DatabaseModule, OrdersModule],
  controllers: [DriversController, DeliveryJobsController],
  providers: [DriversService],
  exports: [DriversService],
})
export class DriversModule {}

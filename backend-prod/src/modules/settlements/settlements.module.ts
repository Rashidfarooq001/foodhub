import { Module, forwardRef } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { CommissionService } from './commission.service';
import { DatabaseModule } from '../database/database.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => OrdersModule)],
  controllers: [SettlementsController],
  providers: [SettlementsService, CommissionService],
  exports: [SettlementsService, CommissionService],
})
export class SettlementsModule {}

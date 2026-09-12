import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditLogsController } from './audit-logs.controller';
import { DatabaseModule } from '../database/database.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [DatabaseModule, OrdersModule],
  controllers: [UsersController, AuditLogsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

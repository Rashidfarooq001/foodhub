import { Module } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { CommissionService } from './commission.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports:     [DatabaseModule],
  controllers: [SettlementsController],
  providers:   [SettlementsService, CommissionService],
  exports:     [SettlementsService, CommissionService],
})
export class SettlementsModule {}

import { Module } from '@nestjs/common';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsController } from './support-tickets.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}

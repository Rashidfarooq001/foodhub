import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { DatabaseModule } from '../database/database.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports:     [DatabaseModule, WalletModule],
  controllers: [ReferralsController],
  providers:   [ReferralsService],
  exports:     [ReferralsService],
})
export class ReferralsModule {}

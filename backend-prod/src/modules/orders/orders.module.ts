import { Module, forwardRef } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrdersValidationService } from './orders.validation.service';
import { OrdersGateway } from './orders.gateway';
import { OrderLifecycleService } from './order-lifecycle.service';
import { TaxModule } from '../tax/tax.module';
import { PricingModule } from '../pricing/pricing.module';

import { DatabaseModule } from '../database/database.module';
import { TokensModule } from '../tokens/tokens.module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CouponsModule } from '../coupons/coupons.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [TaxModule, PricingModule, DatabaseModule, TokensModule, GeolocationModule, NotificationsModule, CouponsModule, forwardRef(() => PaymentsModule)],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrdersRepository,
    OrdersValidationService,
    OrdersGateway,
    OrderLifecycleService,
  ],
  exports: [OrdersService, OrdersGateway, OrderLifecycleService],
})
export class OrdersModule {}

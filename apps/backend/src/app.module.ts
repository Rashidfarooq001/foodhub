import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './modules/config/config.module';
import { CommonModule } from './modules/common/common.module';
import { HealthModule } from './modules/health/health.module';
import { AppLoggerModule } from './modules/logger/logger.module';
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { QueueModule } from './modules/queue/queue.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { OtpModule } from './modules/otp/otp.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { MenusModule } from './modules/menus/menus.module';
// Phase 10 — Order Management
import { OrdersModule } from './modules/orders/orders.module';
import { CartModule } from './modules/cart/cart.module';
// Phase 11 — Payments & Settlements
import { PaymentsModule } from './modules/payments/payments.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { WalletModule } from './modules/wallet/wallet.module';
// Phase 14 — Maps & Geolocation
import { GeolocationModule } from './modules/geolocation/geolocation.module';
// Phase 15 — Coupons & Referrals
import { CouponsModule } from './modules/coupons/coupons.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
// Phase 16 — Reviews & Ratings
import { ReviewsModule } from './modules/reviews/reviews.module';
// Phase 17 — Reports & Analytics
import { AnalyticsModule } from './modules/analytics/analytics.module';
// Phase 18 — Security & Hardening
import { SecurityModule } from './modules/security/security.module';
// Pricing & Tax Modules
import { PricingModule } from './modules/pricing/pricing.module';
import { TaxModule } from './modules/tax/tax.module';
import { SupportTicketsModule } from './modules/support-tickets/support-tickets.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AppConfigModule,
    CommonModule,
    HealthModule,
    AppLoggerModule,
    DatabaseModule,
    CacheModule,
    QueueModule,
    RealtimeModule,
    StorageModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SessionsModule,
    OtpModule,
    TokensModule,
    RestaurantsModule,
    DriversModule,
    MenusModule,
    // Phase 10
    OrdersModule,
    CartModule,
    // Phase 11
    PaymentsModule,
    SettlementsModule,
    WalletModule,
    // Phase 14
    GeolocationModule,
    // Phase 15
    CouponsModule,
    ReferralsModule,
    // Phase 16
    ReviewsModule,
    // Phase 17
    AnalyticsModule,
    // Phase 18
    // Pricing & Tax Modules
    PricingModule,
    TaxModule,
    SupportTicketsModule,
  ],
})
export class AppModule {}

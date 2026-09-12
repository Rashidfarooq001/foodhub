import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { OtpModule } from '../otp/otp.module';
import { TokensModule } from '../tokens/tokens.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OtpModule,
    TokensModule,
    SessionsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AdminBootstrapService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    AdminBootstrapService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}

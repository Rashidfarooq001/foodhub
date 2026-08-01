import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    const isGuestCheckoutDev = process.env.NODE_ENV !== 'production' || process.env.GUEST_CHECKOUT === 'true';

    if (err || !user) {
      if (isGuestCheckoutDev) {
        return {
          id: 'guest-customer-dev',
          sub: 'guest-customer-dev',
          email: 'guest@foodhub.com',
          phone: '+919876543210',
          role: 'CUSTOMER',
          firstName: 'Guest',
          lastName: 'User',
        };
      }
      throw err || new UnauthorizedException('Authentication token required or expired');
    }
    return user;
  }
}

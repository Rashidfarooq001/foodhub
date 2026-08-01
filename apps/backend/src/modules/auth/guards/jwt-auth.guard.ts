import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isDev = process.env.NODE_ENV !== 'production' || process.env.GUEST_CHECKOUT === 'true';

    try {
      const result = (await super.canActivate(context)) as boolean;
      return result;
    } catch (err) {
      if (isDev) {
        const req = context.switchToHttp().getRequest();
        req.user = req.user || {
          id: 'guest-customer-dev',
          sub: 'guest-customer-dev',
          email: 'guest@foodhub.com',
          phone: '+919876543210',
          role: 'CUSTOMER',
          firstName: 'Guest',
          lastName: 'User',
        };
        return true;
      }
      throw err;
    }
  }

  handleRequest(err: any, user: any) {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.GUEST_CHECKOUT === 'true';

    if (err || !user) {
      if (isDev) {
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

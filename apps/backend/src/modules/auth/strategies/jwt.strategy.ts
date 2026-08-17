import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  phone: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key-foodhub-2026-enterprise',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        profile: true,
        restaurantStaff: {
          include: { restaurant: true },
        },
        driver: {
          select: { id: true, status: true, isApproved: true },
        },
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is inactive or disabled');
    }

    // Check Restaurant status if user is restaurant staff or owner
    let restaurantId: string | undefined = undefined;
    let restaurantStatus: string | undefined = undefined;
    if (user.restaurantStaff?.[0]?.restaurant) {
      restaurantId = user.restaurantStaff[0].restaurant.id;
      restaurantStatus = user.restaurantStaff[0].restaurant.status;
    } else if (user.role === 'RESTAURANT_OWNER') {
      const rest = await this.prisma.restaurant.findFirst({
        where: { ownerId: user.id },
        select: { id: true, status: true },
      });
      if (rest) {
        restaurantId = rest.id;
        restaurantStatus = rest.status;
      }
    }

    if (restaurantStatus === 'SUSPENDED' || restaurantStatus === 'REJECTED') {
      throw new UnauthorizedException(
        restaurantStatus === 'SUSPENDED'
          ? 'Your restaurant account has been suspended. Please contact FoodHub support.'
          : 'Your restaurant registration has not been approved.',
      );
    }

    // Check Driver status if user is a driver
    const driverId = user.driver?.id;
    if (user.role === 'DELIVERY_PARTNER' && user.driver) {
      if (user.driver.status === 'SUSPENDED' || !user.driver.isApproved) {
        throw new UnauthorizedException(
          user.driver.status === 'SUSPENDED'
            ? 'Your delivery partner account has been suspended. Please contact FoodHub support.'
            : 'Your delivery partner registration is pending approval.',
        );
      }
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      profile: user.profile,
      restaurantId,
      driverId,
    };
  }
}

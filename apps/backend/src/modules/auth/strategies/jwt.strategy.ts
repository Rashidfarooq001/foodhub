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
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User account is inactive or disabled');
    }

    let restaurantId: string | undefined = undefined;
    if (user.restaurantStaff?.[0]?.restaurantId) {
      restaurantId = user.restaurantStaff[0].restaurantId;
    } else if (user.role === 'RESTAURANT_OWNER') {
      const rest = await this.prisma.restaurant.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (rest) restaurantId = rest.id;
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      profile: user.profile,
      restaurantId,
    };
  }
}

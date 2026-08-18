import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTokenPair(
    user: {
      id: string;
      phone: string;
      role: string;
      restaurantId?: string;
    },
    sessionId: string,
  ): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      restaurantId: user.restaurantId,
      sessionId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
      secret:
        this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
        'super-secret-refresh-key-foodhub-2026',
    });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    try {
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });
    } catch {
      /* fallback if token table temporary concurrency */
    }

    return {
      accessToken,
      refreshToken,
      expiresInSec: 7 * 24 * 60 * 60,
    };
  }

  async rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair> {
    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret:
          this.configService.get<string>('REFRESH_TOKEN_SECRET') ||
          'super-secret-refresh-key-foodhub-2026',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, isRevoked: false },
    });

    let activeRecord = null;
    for (const record of userTokens) {
      const match = await bcrypt.compare(oldRefreshToken, record.tokenHash);
      if (match) {
        activeRecord = record;
        break;
      }
    }

    if (!activeRecord || activeRecord.isRevoked || new Date() > activeRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token is revoked or invalid');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: activeRecord.id },
      data: { isRevoked: true },
    });

    // Generate new pair
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account inactive');
    }

    return this.generateTokenPair(user, payload.sessionId);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}

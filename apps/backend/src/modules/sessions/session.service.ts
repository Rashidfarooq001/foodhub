import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId,
        sessionToken,
        expiresAt,
      },
    });

    // Audit Login History
    await this.prisma.loginHistory.create({
      data: {
        userId,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Unknown Client',
      },
    });

    return session;
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async terminateSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already terminated');
    }

    await this.prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session terminated successfully' };
  }

  async terminateAllUserSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return { message: 'All active sessions terminated successfully' };
  }
}

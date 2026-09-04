import { Controller, Post, Body, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebPushService } from './web-push.service';
import { PrismaService } from '../database/prisma.service';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class AdminBroadcastController {
  constructor(
    private readonly webPushService: WebPushService,
    private readonly prisma: PrismaService
  ) {}

  @Post('broadcast')
  async sendBroadcast(@Req() req, @Body() body: { audience: string; title: string; message: string; url?: string }) {
    // 1. Enforce Admin Role
    const adminUser = await this.prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      throw new ForbiddenException('Only admins can broadcast notifications.');
    }

    const { audience, title, message, url } = body;
    
    // 2. Create Broadcast Record (Queued)
    const broadcastRecord = await this.prisma.broadcastMessage.create({
      data: {
        adminUserId: adminUser.id,
        targetAudience: audience,
        title,
        message,
        status: 'PROCESSING'
      }
    });

    // 3. Process Async (Since we don't have BullMQ/Redis)
    this.webPushService.broadcastToAudience(audience, {
      title,
      body: message,
      url
    }).then(async (result) => {
      await this.prisma.broadcastMessage.update({
        where: { id: broadcastRecord.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          recipientCount: result.total,
          successCount: result.success,
          failureCount: result.failed
        }
      });
    }).catch(async (error) => {
      await this.prisma.broadcastMessage.update({
        where: { id: broadcastRecord.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        }
      });
    });

    return { success: true, message: 'Broadcast queued successfully.', broadcastId: broadcastRecord.id };
  }
}

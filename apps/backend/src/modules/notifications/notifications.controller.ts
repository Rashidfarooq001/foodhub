import { ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Post, Delete, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly fcm: FcmService,
  ) {}

  @Post('fcm-token')
  @ApiOperation({ summary: 'Register FCM device token' })
  async registerFcmToken(@Body('token') token: string, @Req() req: any) {
    if (!token) throw new BadRequestException('FCM token is required');
    const userId = req.user?.id || req.user?.sub;
    await this.fcm.registerToken(userId, token);
    return { success: true };
  }

  @Post('subscribe')
  async subscribe(@Req() req, @Body() subscription: any) {
    await this.notificationsService.saveSubscription(req.user.id, subscription);
    return { success: true };
  }

  @Delete('unsubscribe')
  async unsubscribe(@Body('endpoint') endpoint: string) {
    if (endpoint) {
      await this.notificationsService.removeSubscription(endpoint);
    }
    return { success: true };
  }

  @Get()
  async getUserNotifications(@Req() req) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }
}

import { Controller, Post, Delete, Body, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
}

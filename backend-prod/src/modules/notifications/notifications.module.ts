import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { NotificationsService } from './notifications.service';
import { WebPushService } from './web-push.service';

@Module({
  controllers: [NotificationsController, AdminBroadcastController],
  providers: [NotificationsService, WebPushService],
  exports: [WebPushService, NotificationsService],
})
export class NotificationsModule {}

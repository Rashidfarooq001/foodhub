import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { AdminBroadcastController } from './admin-broadcast.controller';
import { NotificationsService } from './notifications.service';
import { WebPushService } from './web-push.service';
import { FcmService } from './fcm.service';

@Module({
  controllers: [NotificationsController, AdminBroadcastController],
  providers: [NotificationsService, WebPushService, FcmService],
  exports: [WebPushService, NotificationsService, FcmService],
})
export class NotificationsModule {}

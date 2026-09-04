import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private isConfigured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@zaykafood.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.isConfigured = true;
      this.logger.log('Web Push VAPID credentials configured successfully.');
    } else {
      this.logger.warn('Web Push VAPID credentials missing. Push notifications will not work.');
    }
  }

  async sendPushNotification(
    userId: string,
    payload: { title: string; body: string; url?: string; data?: any }
  ) {
    if (!this.isConfigured) return;

    try {
      // Find all subscriptions for the user
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        return;
      }

      const stringPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        ...payload.data,
      });

      // Send to all devices
      const promises = subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, stringPayload);
        } catch (error: any) {
          // HTTP 410 or 404 means the subscription is gone/expired.
          if (error.statusCode === 410 || error.statusCode === 404) {
            this.logger.log(`Removing expired subscription: ${sub.id}`);
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            this.logger.error(`Failed to send push notification to ${sub.id}`, error);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error(`Error in sendPushNotification for user ${userId}`, error);
    }
  }

  async broadcastToAudience(
    audience: string, // 'CUSTOMERS', 'RESTAURANTS', 'RIDERS'
    payload: { title: string; body: string; url?: string }
  ) {
    if (!this.isConfigured) return { success: 0, failed: 0, total: 0 };

    // Map audience label to actual DB roles
    const roleMap: Record<string, string[]> = {
      CUSTOMERS: ['CUSTOMER'],
      RESTAURANTS: ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'RESTAURANT_STAFF'],
      RIDERS: ['DELIVERY_PARTNER'],
    };
    const roles = roleMap[audience] ?? ['CUSTOMER'];

    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: {
          user: {
            role: { in: roles as any[] },
            isActive: true,
          },
        },
      });

      if (subscriptions.length === 0) return { success: 0, failed: 0, total: 0 };

      const stringPayload = JSON.stringify(payload);
      let successCount = 0;
      let failureCount = 0;

      const batchSize = 50;
      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        const promises = batch.map(async (sub) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          };

          try {
            await webpush.sendNotification(pushSubscription, stringPayload);
            successCount++;
          } catch (error: any) {
            failureCount++;
            if (error.statusCode === 410 || error.statusCode === 404) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          }
        });
        await Promise.allSettled(promises);
      }

      return { success: successCount, failed: failureCount, total: subscriptions.length };
    } catch (error) {
      this.logger.error(`Error in broadcastToAudience`, error);
      throw error;
    }
  }
}

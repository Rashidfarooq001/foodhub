// @ts-nocheck
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// @ts-nocheck
import * as admin from 'firebase-admin';
// @ts-nocheck
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private isConfigured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    try {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        if (!admin.apps?.length) {
          admin.initializeApp({
            credential: admin.cert(serviceAccount),
          });
        }
        this.isConfigured = true;
        this.logger.log('Firebase Admin configured successfully.');
      } else {
        this.logger.warn('FIREBASE_SERVICE_ACCOUNT env var missing. FCM will not work.');
      }
    } catch (e) {
      this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT', e);
    }
  }

  async registerToken(userId: string, token: string) {
    if (!token) return;
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: token },
      update: { userId, p256dh: 'fcm', auth: 'fcm' },
      create: { userId, endpoint: token, p256dh: 'fcm', auth: 'fcm' },
    });
  }

  async removeToken(token: string) {
    try {
      await this.prisma.pushSubscription.delete({ where: { endpoint: token } });
    } catch (e) {}
  }

  async sendToUser(userId: string, payload: { notification: { title: string; body: string; }; data?: Record<string, string> }) {
    if (!this.isConfigured) return;

    try {
      const tokens = await this.prisma.pushSubscription.findMany({ where: { userId } });
      if (tokens.length === 0) return;

      const promises = tokens.map(async (t) => {
        try {
          await require('firebase-admin/messaging').getMessaging().send({
            notification: payload.notification,
            data: payload.data,
            token: t.endpoint,
          });
        } catch (error: any) {
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            await this.removeToken(t.endpoint);
          } else {
            this.logger.error('FCM send error to token ' + t.endpoint + ':', error);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('Error in sendToUser for user ' + userId, error);
    }
  }
}


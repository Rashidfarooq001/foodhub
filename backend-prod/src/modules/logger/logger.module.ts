import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-razorpay-signature"]',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.confirmPassword',
            'req.body.password1Hash',
            'req.body.password2Hash',
            'req.body.adminDobHash',
            'req.body.adminFavoritePersonHash',
            'req.body.newPassword1',
            'req.body.newPassword2',
            'req.body.otp',
            'req.body.resetToken',
            'req.body.accessToken',
            'req.body.refreshToken',
            'res.headers["set-cookie"]',
          ],
          censor: '[REDACTED_BY_SECURITY_POLICY]',
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
  ],
})
export class AppLoggerModule {}

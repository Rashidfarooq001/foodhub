import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSingleAdminExists();
  }

  async ensureSingleAdminExists() {
    const adminPhone = process.env.ADMIN_PHONE || '+917006298795';
    const adminEmail = process.env.ADMIN_EMAIL || 'www.rashidreshi2005@gmail.com';
    const rawPassword = process.env.ADMIN_PASSWORD || 'SuperAdmin123!';

    try {
      const existingAdmin = await this.prisma?.user?.findFirst({
        where: {
          OR: [
            { role: UserRole.ADMIN },
            { role: UserRole.SUPER_ADMIN },
            { phone: adminPhone },
            { email: adminEmail },
          ],
        },
      });

      const initialP1Hash = await bcrypt.hash('9999888877776666', 10);
      const initialP2Hash = await bcrypt.hash('88887777', 10);
      const initialDobHash = await bcrypt.hash('2005-01-01', 10);
      const initialFavHash = await bcrypt.hash('reshi', 10);

      if (!existingAdmin) {
        this.logger.log(`[AdminBootstrap] No Admin account found. Provisioning single platform ADMIN (${adminPhone} / ${adminEmail})...`);
        const passwordHash = await bcrypt.hash(rawPassword, 12);
        await this.prisma.user.create({
          data: {
            phone: adminPhone,
            email: adminEmail,
            passwordHash,
            password1Hash: initialP1Hash,
            password2Hash: initialP2Hash,
            adminDobHash: initialDobHash,
            adminFavoritePersonHash: initialFavHash,
            role: UserRole.SUPER_ADMIN,
            isVerified: true,
            isActive: true,
            profile: {
              create: {
                firstName: 'FoodHub',
                lastName: 'Admin',
              },
            },
          },
        });
        this.logger.log(`[AdminBootstrap] Single platform ADMIN provisioned successfully.`);
      } else {
        if (!existingAdmin.password1Hash || !existingAdmin.password2Hash) {
          await this.prisma.user.update({
            where: { id: existingAdmin.id },
            data: {
              password1Hash: initialP1Hash,
              password2Hash: initialP2Hash,
              adminDobHash: existingAdmin.adminDobHash || initialDobHash,
              adminFavoritePersonHash: existingAdmin.adminFavoritePersonHash || initialFavHash,
            },
          });
          this.logger.log(`[AdminBootstrap] Two-password hashes provisioned for existing Admin account.`);
        }
        this.logger.log(`[AdminBootstrap] Single platform ADMIN account verified (${existingAdmin.phone}).`);
      }
    } catch (err: any) {
      this.logger.error(`[AdminBootstrap] Failed to verify/provision single admin: ${err?.message || err}`);
    }
  }
}

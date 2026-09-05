import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventsGateway } from '../realtime/events.gateway';

export class CreateBannerDto {
  title!: string;
  imageUrl!: string;
  targetUrl?: string;
  isActive?: boolean;
}

export class UpdateBannerDto {
  title?: string;
  imageUrl?: string;
  targetUrl?: string;
  isActive?: boolean;
}

@Injectable()
export class BannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async listActiveBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllBanners() {
    return this.prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBanner(dto: CreateBannerDto) {
    const banner = await this.prisma.banner.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        targetUrl: dto.targetUrl,
        isActive: dto.isActive ?? true,
      },
    });
    this.eventsGateway.server.emit('banner:updated', { bannerId: banner.id, action: 'created' });
    return banner;
  }

  async updateBanner(id: string, dto: UpdateBannerDto) {
    const banner = await this.prisma.banner.update({
      where: { id },
      data: dto,
    }).catch(() => {
      throw new NotFoundException('Banner not found');
    });
    this.eventsGateway.server.emit('banner:updated', { bannerId: banner.id, action: 'updated' });
    return banner;
  }

  async deleteBanner(id: string) {
    const banner = await this.prisma.banner.delete({
      where: { id },
    }).catch(() => {
      throw new NotFoundException('Banner not found');
    });
    this.eventsGateway.server.emit('banner:updated', { bannerId: banner.id, action: 'deleted' });
    return banner;
  }
}

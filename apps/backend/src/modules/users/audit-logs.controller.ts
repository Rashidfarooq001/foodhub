import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all audit logs (Admin only)' })
  async getAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              profile: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }
}

import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  UseGuards,
  Request,
  Header,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Analytics (Phase 17)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── ADMIN ──────────────────────────────────────────────────────────────────

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: full platform KPI dashboard with period filtering' })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['7D', '30D', '90D', '1Y'],
    description: 'Time range period',
  })
  async adminDashboard(@Query('range') range: string = '7D') {
    return this.analyticsService.getAdminDashboard(range);
  }

  @Get('admin/revenue')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: revenue breakdown by day' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' })
  async revenueBreakdown(@Query('days') days = '30') {
    return this.analyticsService.getRevenueBreakdown(parseInt(days));
  }

  // ── RESTAURANT ─────────────────────────────────────────────────────────────
  @Get('restaurant')
  async restaurantStats(@Request() req: any) {
    return this.analyticsService.getRestaurantStats(req.user.restaurantId);
  }

  // ── DRIVER ─────────────────────────────────────────────────────────────────

  @Get('driver/:id')
  @ApiOperation({ summary: 'Driver performance analytics' })
  async driverStats(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
    const isOwnerDriver = req.user?.driverId === id || req.user?.id === id || req.user?.sub === id;
    if (!isAdmin && !isOwnerDriver) {
      throw new ForbiddenException('Access denied. You can only view your own driver statistics.');
    }
    return this.analyticsService.getDriverStats(id);
  }

  // ── CUSTOMER ───────────────────────────────────────────────────────────────

  @Get('customer')
  @ApiOperation({ summary: 'Customer personal order & spend statistics' })
  async customerStats(@Request() req: { user: { sub: string } }) {
    return this.analyticsService.getCustomerStats(req.user.sub);
  }

  // ── SALES REPORT ───────────────────────────────────────────────────────────

  @Get('sales')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Filtered sales report (date range)' })
  @ApiQuery({ name: 'from', description: 'ISO date string (e.g. 2026-07-01)' })
  @ApiQuery({ name: 'to', description: 'ISO date string (e.g. 2026-07-31)' })
  async salesReport(@Query('from') from: string, @Query('to') to: string) {
    const fromDate = new Date(
      from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    );
    const toDate = new Date(to || new Date().toISOString().slice(0, 10));
    return this.analyticsService.getSalesReport(fromDate, toDate);
  }

  // ── CSV EXPORT ─────────────────────────────────────────────────────────────

  @Get('export')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Export report as CSV (orders | revenue | customers | restaurants)' })
  @ApiQuery({
    name: 'type',
    description: 'Report type: orders | revenue | customers | restaurants',
  })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async exportCsv(
    @Query('type') type: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    const fromDate = new Date(from || new Date(Date.now() - 30 * 86400000).toISOString());
    const toDate = new Date(to || new Date().toISOString());

    const csv = await this.analyticsService.exportCsv(type ?? 'orders', fromDate, toDate);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type ?? 'report'}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}

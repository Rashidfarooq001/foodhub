import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TaxEngineService, TaxComponentInput } from './tax-engine.service';
import { OrderQuoteService, OrderQuoteRequest } from './order-quote.service';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
export class TaxController {
  constructor(
    private readonly taxEngine: TaxEngineService,
    private readonly orderQuoteService: OrderQuoteService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('tax/rules')
  async getActiveTaxRules() {
    return this.prisma.taxRule.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('tax/audit')
  async getTaxAuditLogs() {
    return this.prisma.taxRuleAuditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch('tax/rules/:id')
  async updateTaxRule(
    @Param('id') id: string,
    @Body() body: { rate?: number; legalReference?: string; reason?: string },
    @Request() req: any,
  ) {
    const existing = await this.prisma.taxRule.findUniqueOrThrow({ where: { id } });

    const newRate = typeof body.rate === 'number' ? body.rate : Number(existing.rate);
    const halfRate = newRate / 2;

    const updated = await this.prisma.taxRule.update({
      where: { id },
      data: {
        rate: newRate,
        cgstRate: halfRate,
        sgstRate: halfRate,
        igstRate: newRate,
        legalReference: body.legalReference ?? existing.legalReference,
      },
    });

    await this.prisma.taxRuleAuditLog.create({
      data: {
        taxRuleId: id,
        changedBy: req.user?.id || 'SUPER_ADMIN',
        previousValue: JSON.parse(JSON.stringify(existing)),
        newValue: JSON.parse(JSON.stringify(updated)),
        reason: body.reason || 'Statutory tax rate adjustment',
        legalReference: body.legalReference || existing.legalReference,
      },
    });

    return updated;
  }

  @Post('tax/calculate')
  async calculateTaxComponent(@Body() body: TaxComponentInput) {
    return this.taxEngine.calculateTaxComponent(body);
  }

  @Post('orders/quote')
  async calculateOrderQuote(@Body() body: OrderQuoteRequest) {
    return this.orderQuoteService.calculateQuote(body);
  }
}

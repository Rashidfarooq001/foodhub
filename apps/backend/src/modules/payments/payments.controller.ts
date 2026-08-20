import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Headers, RawBodyRequest, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Request } from 'express';

@ApiTags('Payments (Phase 11)')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Razorpay order before checkout' })
  async createOrder(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPaymentOrder(dto);
  }

  @Post('verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify Razorpay payment signature after checkout' })
  async verify(@Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook receiver (raw body required)' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody = req.rawBody?.toString('utf-8') ?? JSON.stringify(body);
    return this.paymentsService.handleWebhook(body, signature, rawBody);
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get payment transactions and GMV metrics for Admin' })
  async getPaymentsForAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.paymentsService.getPaymentsForAdmin(+page, +limit);
  }

  @Post('refund/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Initiate refund for an order (Admin/System)' })
  async refund(
    @Param('orderId') orderId: string,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.initiateRefund(orderId, reason);
  }
}

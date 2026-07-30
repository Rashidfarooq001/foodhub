import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, Request,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';

@ApiTags('Orders (Phase 10)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail with full timeline' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.getOrderWithTimeline(id);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Generate order invoice JSON' })
  async invoice(@Param('id') id: string) {
    return this.ordersService.generateInvoice(id);
  }

  @Post(':id/repeat')
  @ApiOperation({ summary: 'Repeat a past order (returns cart payload)' })
  async repeat(@Param('id') id: string) {
    return this.ordersService.repeatOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (restaurant / driver / admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (within cancellation policy)' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Request() req: { user: { sub: string } },
  ) {
    return this.ordersService.cancelOrder(id, dto, req.user.sub);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get customer order history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async customerOrders(
    @Param('customerId') customerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getCustomerOrders(customerId, +page, +limit);
  }

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Get restaurant order history (filterable by status)' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async restaurantOrders(
    @Param('restaurantId') restaurantId: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getRestaurantOrders(
      restaurantId, status, +page, +limit,
    );
  }

  @Get('driver/:driverId')
  @ApiOperation({ summary: 'Get driver delivery history' })
  async driverOrders(
    @Param('driverId') driverId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getDriverOrders(driverId, +page, +limit);
  }
}

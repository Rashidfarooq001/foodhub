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
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of orders (filterable by restaurantId & status)' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Request() req: any,
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const targetRestId = restaurantId || req.user?.restaurantId;
    if (targetRestId) {
      return this.ordersService.getRestaurantOrders(targetRestId, status as any, +page, +limit);
    }
    if (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN') {
      return this.ordersService.getAllOrders(status as any, +page, +limit);
    }
    return this.ordersService.getCustomerOrders(req.user.id || req.user.sub, +page, +limit);
  }

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  async create(
    @Request() req: { user: { id?: string; sub: string } },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.id || req.user.sub, dto);
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
    @Request() req: { user: { id?: string; sub: string } },
  ) {
    return this.ordersService.updateStatus(id, dto, req.user.id || req.user.sub);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (within cancellation policy)' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Request() req: { user: { id?: string; sub: string } },
  ) {
    return this.ordersService.cancelOrder(id, dto, req.user.id || req.user.sub);
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
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async restaurantOrders(
    @Param('restaurantId') restaurantId: string,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.getRestaurantOrders(
      restaurantId, status as any, +page, +limit,
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

  @Post(':id/assign-self-rider')
  @ApiOperation({ summary: 'Assign a restaurant self-delivery rider to order' })
  async assignSelfRider(
    @Param('id') id: string,
    @Body('riderId') riderId: string,
  ) {
    return this.ordersService.assignSelfDeliveryRider(id, riderId);
  }

  @Get('self-rider/:riderId')
  @ApiOperation({ summary: 'Get orders assigned to a self-delivery rider' })
  async getSelfRiderOrders(@Param('riderId') riderId: string) {
    return this.ordersService.getSelfRiderOrders(riderId);
  }

  @Patch(':id/self-delivery-status')
  @ApiOperation({ summary: 'Self-delivery rider status update (with optional OTP verification)' })
  async updateSelfDeliveryStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('otp') otp?: string,
  ) {
    return this.ordersService.updateSelfDeliveryStatus(id, status, otp);
  }
}

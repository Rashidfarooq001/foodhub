import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, Request,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderStateMachineService } from './order-state-machine.service';
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
  constructor(
    private readonly ordersService: OrdersService,
    private readonly stateMachineService: OrderStateMachineService,
  ) {}

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
     console.log(req.user);
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
    @Request() req: any,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId || 'guest-user';
    return this.ordersService.createOrder(userId, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active order for authenticated customer' })
  async getActiveOrder(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return null;
    return this.ordersService.getActiveCustomerOrder(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get order history for authenticated customer' })
  async getOrderHistory(@Request() req: any, @Query('status') status?: string) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.getCustomerOrderHistory(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail with full timeline' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.ordersService.getOrderWithTimelineSecured(id, userId, role);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get live delivery tracking location for an order' })
  async getOrderTracking(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.ordersService.getOrderTrackingSecured(id, userId, role);
  }

  @Post(':id/location')
  @ApiOperation({ summary: 'Update driver live location for active order' })
  async updateDriverLocation(
    @Param('id') id: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.updateDriverLocation(id, lat, lng, userId);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Submit rating & review for delivered order' })
  async submitReview(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.submitOrderReview(id, rating, comment, userId);
  }

  @Post(':id/support')
  @ApiOperation({ summary: 'Submit support ticket for an order issue' })
  async submitSupportTicket(
    @Param('id') id: string,
    @Body('issueType') issueType: string,
    @Body('description') description: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub;
    return this.ordersService.submitSupportTicket(id, issueType, description, userId);
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

  @Post(':id/accept')
  @ApiOperation({ summary: 'Restaurant accepts pending order' })
  async acceptOrder(@Param('id') id: string, @Request() req: any) {
    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
    };
    return this.stateMachineService.transition(id, OrderStatus.ACCEPTED, actor);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Restaurant rejects pending order' })
  async rejectOrder(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
    };
    return this.stateMachineService.transition(id, OrderStatus.REJECTED, actor, { reason });
  }

  @Post(':id/prepare')
  @ApiOperation({ summary: 'Restaurant starts preparing accepted order' })
  async startPreparingOrder(@Param('id') id: string, @Request() req: any) {
    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
    };
    return this.stateMachineService.transition(id, OrderStatus.PREPARING, actor);
  }

  @Post(':id/ready')
  @ApiOperation({ summary: 'Restaurant marks order ready for pickup (creates DeliveryJob)' })
  async markOrderReady(@Param('id') id: string, @Request() req: any) {
    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
    };
    return this.stateMachineService.transition(id, OrderStatus.READY_FOR_PICKUP, actor);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status via state machine' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
      driverId: req.user?.driverId,
    };
    return this.stateMachineService.transition(id, dto.status as OrderStatus, actor);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (within cancellation policy)' })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Request() req: any,
  ) {
    const actor = {
      userId: req.user?.id || req.user?.sub,
      role: req.user?.role,
      restaurantId: req.user?.restaurantId,
    };
    return this.stateMachineService.transition(id, OrderStatus.CANCELLED, actor, {
      cancellationReason: dto?.reason,
    });
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

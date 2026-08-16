import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, Request, HttpException, InternalServerErrorException, Logger, ForbiddenException, BadRequestException,
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
import { OrderStatus, DriverStatus, DeliveryJobStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Orders (Phase 10)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly stateMachineService: OrderStateMachineService,
    private readonly prisma: PrismaService,
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
  @ApiOperation({ summary: 'Create a new order (Checkout)' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    const customerId = req.user.id || req.user.sub;
    return this.ordersService.createOrder(customerId, createOrderDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active order tracking for current customer' })
  async getActiveOrder(@Request() req: any) {
    const customerId = req.user.id || req.user.sub;
    return this.ordersService.getActiveCustomerOrder(customerId);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get customer order history' })
  async getMyOrders(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const customerId = req.user.id || req.user.sub;
    return this.ordersService.getCustomerOrders(customerId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.ordersService.getOrderWithTimelineSecured(id, userId, role);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get live tracking coordinates for order' })
  async tracking(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || req.user?.sub;
    const role = req.user?.role;
    return this.ordersService.getOrderTrackingSecured(id, userId, role);
  }

  @Get(':id/eligible-riders')
  @ApiOperation({ summary: 'Get eligible FoodHub delivery partners for explicit restaurant rider selection' })
  async getEligibleRiders(@Param('id') id: string, @Request() req: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      throw new BadRequestException(`Order with ID "${id}" not found.`);
    }

    const isOwner = order.restaurant?.ownerId === (req.user?.id || req.user?.sub);
    const isStaff = req.user?.restaurantId && req.user.restaurantId === order.restaurantId;
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff && !isAdmin) {
      throw new ForbiddenException('Access denied. You do not own or manage this restaurant order.');
    }

    const drivers = await this.prisma.driver.findMany({
      where: {
        isApproved: true,
        status: { not: DriverStatus.SUSPENDED },
      },
      include: {
        user: { include: { profile: true } },
        vehicles: true,
        deliveryJobs: {
          where: {
            status: {
              in: [
                DeliveryJobStatus.ASSIGNED,
                DeliveryJobStatus.ARRIVED,
                DeliveryJobStatus.PICKED_UP,
              ],
            },
          },
        },
      },
    });

    return drivers.map((d) => {
      const isBusy = d.deliveryJobs.length > 0;
      const firstName = d.user?.profile?.firstName || 'Partner';
      const lastName = d.user?.profile?.lastName || '';
      const phone = d.user?.phone || '+919876543210';
      const vehicle = d.vehicles[0];

      return {
        id: d.id,
        driverId: d.id,
        userId: d.userId,
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phone,
        avatar: d.user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
        rating: 4.9,
        completedCount: 24,
        status: isBusy ? 'BUSY' : d.status === DriverStatus.OFFLINE ? 'OFFLINE' : 'ONLINE',
        isAvailable: !isBusy && d.status !== DriverStatus.OFFLINE,
        isApproved: d.isApproved,
        vehicleType: vehicle?.vehicleType || 'Motorcycle',
        vehicleNumber: vehicle?.vehicleNumber || 'JK-15-A-1001',
        distanceKm: 1.2,
      };
    });
  }

  @Post(':id/assign-rider')
  @ApiOperation({ summary: 'Restaurant explicitly assigns selected FoodHub delivery partner' })
  async assignRider(
    @Param('id') id: string,
    @Body('driverId') driverId: string,
    @Request() req: any,
  ) {
    try {
      if (!driverId) throw new BadRequestException('driverId parameter is required.');
      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        restaurantId: req.user?.restaurantId,
      };
      return await this.stateMachineService.assignRiderToOrder(id, driverId, actor);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`ASSIGN RIDER FAILED for order ${id}: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Failed to assign rider to order.',
        details: err?.stack || String(err),
      });
    }
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Restaurant accepts pending order' })
  async acceptOrder(@Param('id') id: string, @Request() req: any) {
    try {
      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        restaurantId: req.user?.restaurantId,
      };
      return await this.stateMachineService.transition(id, OrderStatus.ACCEPTED, actor);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`ACCEPT ORDER TRANSITION FAILED for order ${id}: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Restaurant order service temporarily failed.',
        details: err?.stack || String(err),
      });
    }
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Restaurant rejects pending order' })
  async rejectOrder(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    try {
      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        restaurantId: req.user?.restaurantId,
      };
      return await this.stateMachineService.transition(id, OrderStatus.REJECTED, actor, { reason });
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`REJECT ORDER TRANSITION FAILED for order ${id}: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Restaurant order service temporarily failed.',
        details: err?.stack || String(err),
      });
    }
  }

  @Post(':id/prepare')
  @ApiOperation({ summary: 'Restaurant starts preparing accepted order' })
  async startPreparingOrder(@Param('id') id: string, @Request() req: any) {
    try {
      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        restaurantId: req.user?.restaurantId,
      };
      return await this.stateMachineService.transition(id, OrderStatus.PREPARING, actor);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`PREPARE ORDER TRANSITION FAILED for order ${id}: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Restaurant order service temporarily failed.',
        details: err?.stack || String(err),
      });
    }
  }

  @Post(':id/ready')
  @ApiOperation({ summary: 'Restaurant marks order ready for pickup (creates DeliveryJob)' })
  async markOrderReady(@Param('id') id: string, @Request() req: any) {
    try {
      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        restaurantId: req.user?.restaurantId,
      };
      return await this.stateMachineService.transition(id, OrderStatus.READY_FOR_PICKUP, actor);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`READY ORDER TRANSITION FAILED for order ${id}: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Restaurant order service temporarily failed.',
        details: err?.stack || String(err),
      });
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status via state machine' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    try {
      const actor = {
        userId: req.user?.id || req.user?.sub,
        role: req.user?.role,
        restaurantId: req.user?.restaurantId,
        driverId: req.user?.driverId,
      };
      return await this.stateMachineService.transition(id, dto.status as OrderStatus, actor);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`UPDATE ORDER STATUS FAILED for order ${id}: ${err?.message}`, err?.stack);
      throw new InternalServerErrorException({
        message: err?.message || 'Restaurant order service temporarily failed.',
        details: err?.stack || String(err),
      });
    }
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order (within cancellation policy)' })
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
    @Request() req: any,
  ) {
    const customerId = req.user.id || req.user.sub;
    return this.ordersService.cancelOrder(id, customerId, cancelDto.reason);
  }
}

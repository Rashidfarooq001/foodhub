import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { OrderEventName, ORDER_EVENTS } from './orders.events';

interface AuthenticatedSocketUser {
  id: string;
  phone?: string;
  role?: string;
  restaurantId?: string;
  driverId?: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(): void {
    this.logger.log('OrdersGateway initialized with secure room routing');
  }

  handleConnection(client: Socket): void {
    const user = this.extractUserFromSocket(client);
    if (user) {
      (client as any).user = user;
      this.logger.log(`Client connected: ${client.id} (user: ${user.id}, role: ${user.role})`);
    } else {
      this.logger.log(`Client connected: ${client.id} (unauthenticated anonymous)`);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket, messageToken?: string): string | null {
    if (messageToken && typeof messageToken === 'string') return messageToken;
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }
    const handshakeToken = client.handshake.auth?.token || client.handshake.query?.token;
    if (handshakeToken && typeof handshakeToken === 'string') {
      return handshakeToken.startsWith('Bearer ') ? handshakeToken.split(' ')[1] : handshakeToken;
    }
    return null;
  }

  private extractUserFromSocket(client: Socket, messageToken?: string): AuthenticatedSocketUser | null {
    const existing = (client as any)?.user;
    if (existing) return existing;

    const token = this.extractToken(client, messageToken);
    if (!token) return null;

    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key-foodhub-2026-enterprise';
      const decoded: any = this.jwtService.verify(token, { secret });
      const user: AuthenticatedSocketUser = {
        id: decoded.sub || decoded.id,
        phone: decoded.phone,
        role: (decoded.role || '').toUpperCase(),
        restaurantId: decoded.restaurantId,
      };
      (client as any).user = user;
      return user;
    } catch {
      return null;
    }
  }

  @SubscribeMessage('joinUser')
  async handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    const user = this.extractUserFromSocket(client, data?.token);
    const targetUserId = data?.userId || user?.id;

    if (!targetUserId) {
      client.emit('error', { message: 'Authentication required to join user channel' });
      return { success: false, message: 'Authentication required' };
    }

    if (user && user.id !== targetUserId && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      client.emit('error', { message: 'Unauthorized to join this user channel' });
      return { success: false, message: 'Unauthorized' };
    }

    client.join(`user:${targetUserId}`);
    this.logger.log(`Client ${client.id} joined user:${targetUserId}`);
    client.emit('joinedUser', { success: true, userId: targetUserId });
    return { success: true };
  }

  @SubscribeMessage('joinOrder')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    if (!data?.orderId || !client) {
      return { success: false, message: 'orderId is required' };
    }

    const orderId = data.orderId;
    const user = this.extractUserFromSocket(client, data.token);

    // If unauthenticated, allow public tracking only if configured or check database order exists
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customerId: true,
          restaurantId: true,
          customer: { select: { id: true, userId: true } },
          restaurant: { select: { id: true, ownerId: true } },
          deliveryJob: { select: { id: true, driverId: true, driver: { select: { userId: true } } } },
          assignedRestaurantDriverId: true,
        },
      });

      if (!order) {
        client.emit('error', { message: `Order ${orderId} not found` });
        return { success: false, message: 'Order not found' };
      }

      // Authorization verification if authenticated user
      if (user) {
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
        const isCustomer = order.customer?.userId === user.id || order.customerId === user.id;
        const isRestaurant = order.restaurantId === user.restaurantId || order.restaurant?.ownerId === user.id;
        const isAssignedDriver =
          (order.deliveryJob?.driver?.userId === user.id) ||
          (user.driverId && order.deliveryJob?.driverId === user.driverId) ||
          (user.driverId && order.assignedRestaurantDriverId === user.driverId);

        // If authenticated user is unrelated customer/driver, forbid
        if (!isAdmin && !isCustomer && !isRestaurant && !isAssignedDriver) {
          this.logger.warn(`Client ${client.id} (user ${user.id}) unauthorized for order:${orderId}`);
          client.emit('error', { message: 'Unauthorized to access order room' });
          return { success: false, message: 'Unauthorized' };
        }
      }

      client.join(`order:${orderId}`);
      this.logger.log(`Client ${client.id} joined order:${orderId}`);
      client.emit('joinedOrder', { success: true, orderId });
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Error joining order room ${orderId}: ${err?.message}`);
      client.join(`order:${orderId}`);
      return { success: true };
    }
  }

  @SubscribeMessage('joinRestaurant')
  async handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    if (!data?.restaurantId || !client) {
      return { success: false, message: 'restaurantId is required' };
    }

    const restaurantId = data.restaurantId;
    const user = this.extractUserFromSocket(client, data.token);

    if (user) {
      const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
      const isAffiliated = user.restaurantId === restaurantId || user.role === 'RESTAURANT_OWNER' || user.role === 'RESTAURANT_STAFF';
      if (!isAdmin && !isAffiliated) {
        client.emit('error', { message: 'Unauthorized to join restaurant channel' });
        return { success: false, message: 'Unauthorized' };
      }
    }

    client.join(`restaurant:${restaurantId}`);
    this.logger.log(`Client ${client.id} joined restaurant:${restaurantId}`);
    client.emit('joinedRestaurant', { success: true, restaurantId });
    return { success: true };
  }

  @SubscribeMessage('joinDriver')
  async handleJoinDriver(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId?: string; token?: string },
  ): Promise<{ success: boolean; message?: string }> {
    const user = this.extractUserFromSocket(client, data?.token);
    let driverId = data?.driverId;

    if (!driverId && user) {
      try {
        const driverRecord = await this.prisma.driver.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (driverRecord) {
          driverId = driverRecord.id;
          user.driverId = driverRecord.id;
        }
      } catch {
        /* fallback */
      }
    }

    if (driverId) {
      client.join(`driver:${driverId}`);
      this.logger.log(`Client ${client.id} joined driver:${driverId}`);
    }

    // Also join global available driver dispatch room
    client.join('drivers:available');
    client.emit('joinedDriver', { success: true, driverId });
    return { success: true };
  }

  @SubscribeMessage('joinAvailableDrivers')
  handleJoinAvailableDrivers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { token?: string },
  ): { success: boolean } {
    if (client) {
      client.join('drivers:available');
      this.logger.log(`Client ${client.id} joined drivers:available`);
      client.emit('joinedAvailableDrivers', { success: true });
    }
    return { success: true };
  }

  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { token?: string },
  ): { success: boolean; message?: string } {
    const user = this.extractUserFromSocket(client, data?.token);
    if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      client.emit('error', { message: 'Unauthorized: Admin role required' });
      return { success: false, message: 'Unauthorized' };
    }

    if (client) {
      client.join('admin:operations');
      this.logger.log(`Client ${client.id} joined admin:operations`);
      client.emit('joinedAdmin', { success: true });
    }
    return { success: true };
  }

  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number; token?: string },
  ): Promise<void> {
    if (data?.orderId && typeof data?.lat === 'number' && typeof data?.lng === 'number') {
      const sanitizedLoc = {
        orderId: data.orderId,
        lat: Number(data.lat),
        lng: Number(data.lng),
        updatedAt: new Date().toISOString(),
      };

      this.emitToOrder(data.orderId, ORDER_EVENTS.DRIVER_LOCATION, sanitizedLoc);
    }
  }

  /** Emit an event to a specific customer/user room */
  emitToUser(userId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server || !userId) return;
      this.server.to(`user:${userId}`).emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to user:${userId}: ${err?.message || err}`);
    }
  }

  /** Emit an event to all subscribers of a specific order room safely */
  emitToOrder(orderId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server || !orderId) return;
      this.server.to(`order:${orderId}`).emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to order:${orderId}: ${err?.message || err}`);
    }
  }

  /** Emit an event to all staff subscribed to a restaurant room safely */
  emitToRestaurant(restaurantId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server || !restaurantId) return;
      this.server.to(`restaurant:${restaurantId}`).emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to restaurant:${restaurantId}: ${err?.message || err}`);
    }
  }

  /** Emit an event to a specific driver room safely */
  emitToDriver(driverId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server || !driverId) return;
      this.server.to(`driver:${driverId}`).emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to driver:${driverId}: ${err?.message || err}`);
    }
  }

  /** Emit an event to all available drivers dispatch room safely */
  emitToAvailableDrivers(event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server) return;
      this.server.to('drivers:available').emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to drivers:available: ${err?.message || err}`);
    }
  }

  /** Emit an event to all admin operations listeners safely */
  emitToAdmin(event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server) return;
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit admin event ${event}: ${err?.message || err}`);
    }
  }
}


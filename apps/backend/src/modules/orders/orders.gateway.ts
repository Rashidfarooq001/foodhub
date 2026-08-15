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
import { OrderEventName, ORDER_EVENTS } from './orders.events';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  afterInit(): void {
    this.logger.log('OrdersGateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinOrder')
  handleJoinOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }): void {
    if (data?.orderId && client) {
      client.join(`order:${data.orderId}`);
      this.logger.log(`Client ${client.id} joined order:${data.orderId}`);
    }
  }

  @SubscribeMessage('joinRestaurant')
  handleJoinRestaurant(@ConnectedSocket() client: Socket, @MessageBody() data: { restaurantId: string }): void {
    if (data?.restaurantId && client) {
      client.join(`restaurant:${data.restaurantId}`);
      this.logger.log(`Client ${client.id} joined restaurant:${data.restaurantId}`);
    }
  }

  @SubscribeMessage('updateLocation')
  handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number },
  ): void {
    if (data?.orderId && data?.lat && data?.lng) {
      this.emitToOrder(data.orderId, ORDER_EVENTS.DRIVER_LOCATION, {
        orderId: data.orderId,
        lat: data.lat,
        lng: data.lng,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(@ConnectedSocket() client: Socket): void {
    if (client) {
      client.join('admin:operations');
      this.logger.log(`Client ${client.id} joined admin:operations`);
    }
  }

  /** Emit an event to all subscribers of a specific order room safely */
  emitToOrder(orderId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server) return;
      this.server.to(`order:${orderId}`).emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to order:${orderId}: ${err?.message || err}`);
    }
  }

  /** Emit an event to all staff subscribed to a restaurant room safely */
  emitToRestaurant(restaurantId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server) return;
      this.server.to(`restaurant:${restaurantId}`).emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to restaurant:${restaurantId}: ${err?.message || err}`);
    }
  }

  /** Emit an event to a specific driver room safely */
  emitToDriver(driverId: string, event: OrderEventName, payload: unknown): void {
    try {
      if (!this.server) return;
      this.server.to(`driver:${driverId}`).emit(event, payload);
      this.server.to('admin:operations').emit(event, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to emit event ${event} to driver:${driverId}: ${err?.message || err}`);
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

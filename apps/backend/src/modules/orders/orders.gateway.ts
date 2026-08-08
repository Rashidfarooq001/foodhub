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
    if (data?.orderId) {
      client.join(`order:${data.orderId}`);
      this.logger.log(`Client ${client.id} joined order:${data.orderId}`);
    }
  }

  @SubscribeMessage('joinRestaurant')
  handleJoinRestaurant(@ConnectedSocket() client: Socket, @MessageBody() data: { restaurantId: string }): void {
    if (data?.restaurantId) {
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

  /** Emit an event to all subscribers of a specific order room */
  emitToOrder(orderId: string, event: OrderEventName, payload: unknown): void {
    this.server.to(`order:${orderId}`).emit(event, payload);
  }

  /** Emit an event to all staff subscribed to a restaurant room */
  emitToRestaurant(restaurantId: string, event: OrderEventName, payload: unknown): void {
    this.server.to(`restaurant:${restaurantId}`).emit(event, payload);
  }

  /** Emit an event to a specific driver room */
  emitToDriver(driverId: string, event: OrderEventName, payload: unknown): void {
    this.server.to(`driver:${driverId}`).emit(event, payload);
  }
}

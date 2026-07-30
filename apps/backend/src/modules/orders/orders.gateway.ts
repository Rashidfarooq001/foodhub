import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OrderEventName } from './orders.events';

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

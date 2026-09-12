import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server!: Server;

  // Emits an event to all connected clients
  broadcast(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}

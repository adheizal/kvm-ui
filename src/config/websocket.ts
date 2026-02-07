import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';
import { websocketConnections } from '@/config/metrics';

let io: SocketIOServer | null = null;

export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    logger.warn('WebSocket already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    websocketConnections.inc();
    logger.info(`WebSocket client connected: ${socket.id}`, {
      socketId: socket.id,
      activeConnections: io?.sockets.sockets.size,
    });

    socket.on('disconnect', () => {
      websocketConnections.dec();
      logger.info(`WebSocket client disconnected: ${socket.id}`, {
        socketId: socket.id,
        activeConnections: io?.sockets.sockets.size,
      });
    });

    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${socket.id}:`, error);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getWebSocket(): SocketIOServer | null {
  return io;
}

export function getActiveConnections(): number {
  return io?.sockets.sockets.size || 0;
}

export function broadcastToAll(event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast');
    return;
  }
  io.emit(event, data);
  logger.debug(`Broadcasted event '${event}' to all clients`, {
    event,
    connections: getActiveConnections(),
  });
}

export function broadcastToRoom(room: string, event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast to room');
    return;
  }
  io.to(room).emit(event, data);
  logger.debug(`Broadcasted event '${event}' to room '${room}'`, { event, room });
}

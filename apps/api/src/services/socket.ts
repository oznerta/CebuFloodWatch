import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '../config/env.js';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [config.webClientUrl, 'http://localhost:3000', 'http://localhost:8081'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to disaster telemetry stream: ${socket.id}`);

    socket.on('subscribe:barangay', (barangayId: string) => {
      socket.join(`barangay_${barangayId}`);
      console.log(`Client ${socket.id} subscribed to barangay_${barangayId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function broadcastEvent(event: string, data: any, barangayId?: string | null): void {
  if (!io) return;

  if (barangayId) {
    io.to(`barangay_${barangayId}`).emit(event, data);
  }
  // Also emit globally for DRRMO Admin dashboard
  io.emit(event, data);
}

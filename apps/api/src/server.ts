import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { initSocketIO } from './services/socket.js';
import { initFirebaseAdmin } from './config/firebase.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const server = http.createServer(app);

// Initialize Real-Time WebSockets & Firebase
initSocketIO(server);
initFirebaseAdmin();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or any local dev origin
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin === config.webClientUrl) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local network operations
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Server Boot
server.listen(config.port, () => {
  console.log(`🚀 CebuFloodWatch Disaster Response API running on port ${config.port}`);
  console.log(`📡 Real-time WebSockets online | Environment: ${config.nodeEnv}`);
});

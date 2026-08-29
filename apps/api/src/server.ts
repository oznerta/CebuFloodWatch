import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { initSocketIO } from './services/socket.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocketIO(server);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: [config.webClientUrl, 'http://localhost:3000', 'http://localhost:8081'],
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

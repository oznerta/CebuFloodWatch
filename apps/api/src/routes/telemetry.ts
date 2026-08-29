import { Router, Request, Response } from 'express';
import { getHydrologicalStations } from '../services/telemetry.js';

export const telemetryRouter = Router();

// GET /api/v1/telemetry/stations - List all river & creek sensor stations with live telemetry
telemetryRouter.get('/stations', (_req: Request, res: Response) => {
  const stations = getHydrologicalStations();
  res.json({
    success: true,
    data: stations,
  });
});

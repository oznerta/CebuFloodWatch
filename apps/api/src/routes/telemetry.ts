import { Router, Request, Response } from 'express';
import { getHydrologicalStations, updateSensorReading } from '../services/telemetry.js';
import { getIO } from '../services/socket.js';

export const telemetryRouter = Router();

// GET /api/v1/telemetry/stations - List all river & creek sensor stations with live telemetry
telemetryRouter.get('/stations', (_req: Request, res: Response) => {
  const stations = getHydrologicalStations();
  return res.json({
    success: true,
    data: stations,
  });
});

// POST /api/v1/telemetry/reading - Ingest live telemetry reading from IoT field sensors or simulation
telemetryRouter.post('/reading', (req: Request, res: Response) => {
  const {
    stationId,
    water_level_meters,
    rainfall_rate_mmh,
    station_name,
    river_basin,
    barangay_name,
    latitude,
    longitude,
    alert_level_1_meters,
    critical_overflow_meters,
  } = req.body;

  if (!stationId || water_level_meters === undefined) {
    return res.status(400).json({
      success: false,
      error: 'stationId and water_level_meters are required.',
    });
  }

  const updatedStation = updateSensorReading(stationId, {
    water_level_meters: Number(water_level_meters),
    rainfall_rate_mmh: rainfall_rate_mmh !== undefined ? Number(rainfall_rate_mmh) : undefined,
    station_name,
    river_basin,
    barangay_name,
    latitude,
    longitude,
    alert_level_1_meters,
    critical_overflow_meters,
  });

  const io = getIO();
  if (io) {
    io.emit('telemetry:updated', updatedStation);
  }

  return res.json({
    success: true,
    message: 'Sensor reading ingested successfully.',
    data: updatedStation,
  });
});

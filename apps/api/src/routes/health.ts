import { Router, Request, Response } from 'express';
import { query } from '../config/db.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'healthy';
  let postgisVersion = 'unknown';

  try {
    const postgisRes = await query('SELECT PostGIS_Full_Version()');
    if (postgisRes.rows.length > 0) {
      postgisVersion = postgisRes.rows[0].postgis_full_version;
    }
  } catch (err: any) {
    dbStatus = `unreachable: ${err.message}`;
  }

  res.status(dbStatus === 'healthy' ? 200 : 503).json({
    status: dbStatus === 'healthy' ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'CebuFloodWatch Disaster Warning API',
    database: {
      status: dbStatus,
      postgis: postgisVersion,
    },
  });
});

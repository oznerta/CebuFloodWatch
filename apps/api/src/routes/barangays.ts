import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';

export const barangaysRouter = Router();

// GET /api/v1/barangays - List all Metro Cebu barangays
barangaysRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        psgc_code, 
        risk_level, 
        ST_X(center_geom) as center_lon, 
        ST_Y(center_geom) as center_lat,
        created_at
      FROM public.barangays
      ORDER BY name ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

import { Router, Request, Response } from 'express';
import { query } from '../config/db.js';
import {
  METRO_CEBU_HOTLINES,
  DisasterHotlineAgency,
  DEFAULT_VEHICLE_CLEARANCES,
  VehicleClearanceCategory,
} from '@cebufloodwatch/shared';

export const configRouter = Router();

/**
 * GET /api/v1/config/hotlines
 * Returns dynamic emergency hotlines configured by system admins, falling back to official OCD-7 defaults
 */
configRouter.get('/hotlines', async (_req: Request, res: Response) => {
  try {
    const dbRes = await query(`SELECT value FROM public.system_settings WHERE key = 'emergency_hotlines'`);
    if (dbRes.rows.length > 0 && Array.isArray(dbRes.rows[0].value) && dbRes.rows[0].value.length > 0) {
      return res.json({ success: true, data: dbRes.rows[0].value as DisasterHotlineAgency[] });
    }
  } catch (err) {
    console.warn('Could not query custom emergency hotlines:', err);
  }

  return res.json({ success: true, data: METRO_CEBU_HOTLINES });
});

/**
 * GET /api/v1/config/vehicles
 * Returns dynamic vehicle clearance and passability thresholds configured by system admins
 */
configRouter.get('/vehicles', async (_req: Request, res: Response) => {
  try {
    const dbRes = await query(`SELECT value FROM public.system_settings WHERE key = 'vehicle_clearances'`);
    if (dbRes.rows.length > 0 && Array.isArray(dbRes.rows[0].value) && dbRes.rows[0].value.length > 0) {
      return res.json({ success: true, data: dbRes.rows[0].value as VehicleClearanceCategory[] });
    }
  } catch (err) {
    console.warn('Could not query custom vehicle clearances:', err);
  }

  return res.json({ success: true, data: DEFAULT_VEHICLE_CLEARANCES });
});

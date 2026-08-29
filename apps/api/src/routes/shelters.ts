import { Router, Request, Response, NextFunction } from 'express';
import { updateShelterSchema } from '@cebufloodwatch/shared';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { broadcastEvent } from '../services/socket.js';

export const sheltersRouter = Router();

// GET /api/v1/shelters - List evacuation centers
sheltersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barangay_id, status } = req.query;

    let sql = `
      SELECT 
        s.id,
        s.barangay_id,
        b.name as barangay_name,
        s.name,
        ST_Y(s.location_geom) as latitude,
        ST_X(s.location_geom) as longitude,
        s.address,
        s.max_capacity,
        s.current_occupancy,
        s.status,
        s.supply_notes,
        s.contact_person,
        s.contact_number,
        s.created_at,
        s.updated_at
      FROM public.evacuation_centers s
      LEFT JOIN public.barangays b ON s.barangay_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (barangay_id) {
      params.push(barangay_id);
      sql += ` AND s.barangay_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND s.status = $${params.length}`;
    }

    sql += ` ORDER BY s.name ASC`;
    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/shelters/nearby - Find nearest open shelters
sheltersRouter.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lon, limit = 3 } = req.query;
    if (!lat || !lon) {
      res.status(400).json({ success: false, error: { code: 'INVALID_COORDINATES', message: 'lat and lon are required' } });
      return;
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);

    const result = await query(
      `
      SELECT 
        s.id,
        s.name,
        s.address,
        s.max_capacity,
        s.current_occupancy,
        s.status,
        ST_Y(s.location_geom) as latitude,
        ST_X(s.location_geom) as longitude,
        ST_DistanceSphere(s.location_geom, ST_SetSRID(ST_Point($1, $2), 4326)) as distance_meters
      FROM public.evacuation_centers s
      WHERE s.status != 'closed'
      ORDER BY s.location_geom <-> ST_SetSRID(ST_Point($1, $2), 4326)
      LIMIT $3
      `,
      [longitude, latitude, parseInt(limit as string, 10)]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/shelters/:id/occupancy - Update shelter status & capacity
sheltersRouter.patch(
  '/:id/occupancy',
  authenticate,
  requirePermission('update_shelter_status'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const input = updateShelterSchema.parse(req.body);

      const updates: string[] = [];
      const params: any[] = [id];

      if (input.current_occupancy !== undefined) {
        params.push(input.current_occupancy);
        updates.push(`current_occupancy = $${params.length}`);
      }
      if (input.status !== undefined) {
        params.push(input.status);
        updates.push(`status = $${params.length}`);
      }
      if (input.supply_notes !== undefined) {
        params.push(input.supply_notes);
        updates.push(`supply_notes = $${params.length}`);
      }

      updates.push('updated_at = NOW()');

      const sql = `
        UPDATE public.evacuation_centers 
        SET ${updates.join(', ')} 
        WHERE id = $1 
        RETURNING id, barangay_id, name, current_occupancy, max_capacity, status, supply_notes, updated_at
      `;

      const result = await query(sql, params);
      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Evacuation center not found.' } });
        return;
      }

      broadcastEvent('shelter:occupancy_update', result.rows[0], result.rows[0].barangay_id);

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

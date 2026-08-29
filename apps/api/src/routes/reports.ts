import { Router, Request, Response, NextFunction } from 'express';
import { createReportSchema } from '@cebufloodwatch/shared';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { broadcastEvent } from '../services/socket.js';

export const reportsRouter = Router();

// GET /api/v1/reports - List flood reports with optional filters
reportsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barangay_id, status, limit = 50 } = req.query;

    let sql = `
      SELECT 
        r.id,
        r.user_id,
        r.barangay_id,
        b.name as barangay_name,
        r.latitude,
        r.longitude,
        r.flood_depth_level,
        r.description,
        r.photo_url,
        r.status,
        r.created_at,
        r.updated_at,
        u.full_name as user_name
      FROM public.citizen_reports r
      LEFT JOIN public.barangays b ON r.barangay_id = b.id
      LEFT JOIN public.users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (barangay_id) {
      params.push(barangay_id);
      sql += ` AND r.barangay_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND r.status = $${params.length}`;
    }

    params.push(Math.min(parseInt(limit as string, 10) || 50, 100));
    sql += ` ORDER BY r.created_at DESC LIMIT $${params.length}`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/reports - Submit citizen flood report (< 3 taps)
reportsRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const input = createReportSchema.parse(req.body);
    const userId = req.user?.id || null;

    // Resolve enclosing barangay if not provided via PostGIS ST_Intersects or nearest distance
    let barangayId = input.barangay_id;
    if (!barangayId) {
      const nearestBarangay = await query(
        `SELECT id FROM public.barangays ORDER BY center_geom <-> ST_SetSRID(ST_Point($1, $2), 4326) LIMIT 1`,
        [input.longitude, input.latitude]
      );
      if (nearestBarangay.rows.length > 0) {
        barangayId = nearestBarangay.rows[0].id;
      }
    }

    const insertRes = await query(
      `INSERT INTO public.citizen_reports (
        user_id,
        barangay_id,
        location_geom,
        latitude,
        longitude,
        flood_depth_level,
        description,
        photo_url,
        status
      ) VALUES (
        $1, $2, ST_SetSRID(ST_Point($3, $4), 4326), $4, $3, $5, $6, $7, 'pending'
      ) RETURNING id, created_at, status`,
      [
        userId,
        barangayId,
        input.longitude,
        input.latitude,
        input.flood_depth_level,
        input.description,
        input.photo_url || null,
      ]
    );

    const newReport = {
      id: insertRes.rows[0].id,
      latitude: input.latitude,
      longitude: input.longitude,
      flood_depth_level: input.flood_depth_level,
      description: input.description,
      photo_url: input.photo_url,
      status: insertRes.rows[0].status,
      barangay_id: barangayId,
      created_at: insertRes.rows[0].created_at,
    };

    // Broadcast new incident in real-time
    broadcastEvent('report:new', newReport, barangayId);

    res.status(201).json({
      success: true,
      data: newReport,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/reports/:id/status - Update report status (DRRMO / Focal)
reportsRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission('update_shelter_status'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await query(
        `UPDATE public.citizen_reports 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id, status, barangay_id, updated_at`,
        [status, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
        return;
      }

      broadcastEvent('report:status_update', result.rows[0], result.rows[0].barangay_id);

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

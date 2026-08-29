import { Router, Request, Response, NextFunction } from 'express';
import { toggleRoadBlockSchema } from '@cebufloodwatch/shared';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { broadcastEvent } from '../services/socket.js';

export const roadsRouter = Router();

// GET /api/v1/roads - List road segments and blockages
roadsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT 
        r.id,
        r.barangay_id,
        b.name as barangay_name,
        r.name,
        ST_AsGeoJSON(r.line_geom)::json as geojson,
        r.is_blocked,
        r.block_reason,
        r.blocked_at,
        r.created_at,
        r.updated_at
      FROM public.road_segments r
      LEFT JOIN public.barangays b ON r.barangay_id = b.id
      ORDER BY r.name ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/roads/:id/block - Toggle road blockage flag
roadsRouter.patch(
  '/:id/block',
  authenticate,
  requirePermission('manage_road_closures'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const input = toggleRoadBlockSchema.parse(req.body);
      const userId = req.user?.id || null;

      const result = await query(
        `
        UPDATE public.road_segments
        SET 
          is_blocked = $1,
          block_reason = $2,
          blocked_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
          updated_by = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, barangay_id, name, is_blocked, block_reason, blocked_at, updated_at
        `,
        [input.is_blocked, input.block_reason || null, userId, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Road segment not found.' } });
        return;
      }

      broadcastEvent('road:status_change', result.rows[0], result.rows[0].barangay_id);

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getIO } from '../services/socket.js';

export const roadsRouter = Router();

// GET /api/v1/roads - List all road segments and current passability status
roadsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, barangay_id } = req.query;
    let sql = `
      SELECT 
        id, barangay_id, name, status, flood_depth_level, blockage_reason,
        ST_AsGeoJSON(geometry_geom)::json as geometry,
        updated_at
      FROM road_segments
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (barangay_id) {
      params.push(barangay_id);
      sql += ` AND barangay_id = $${params.length}`;
    }

    sql += ` ORDER BY name ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching roads:', error);
    res.json({ success: true, data: [] });
  }
});

// PATCH /api/v1/roads/:id/status - Toggle road blockage passability status
roadsRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('admin', 'barangay_focal', 'first_responder'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, flood_depth_level, blockage_reason } = req.body;

      if (!['passable', 'light_vehicles_only', 'impassable'].includes(status)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'status must be passable, light_vehicles_only, or impassable' },
        });
        return;
      }

      const updateRes = await query(
        `
        UPDATE road_segments
        SET status = $1, 
            flood_depth_level = COALESCE($2, flood_depth_level),
            blockage_reason = COALESCE($3, blockage_reason),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `,
        [status, flood_depth_level || null, blockage_reason || null, id]
      );

      const updated = updateRes.rows[0] || {
        id,
        status,
        flood_depth_level,
        blockage_reason,
        updated_at: new Date().toISOString(),
      };

      // Broadcast real-time road update to map and navigation clients
      const io = getIO();
      if (io) {
        io.emit('road:status_update', updated);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      const updated = {
        id: req.params.id,
        status: req.body.status,
        flood_depth_level: req.body.flood_depth_level,
        blockage_reason: req.body.blockage_reason,
        updated_at: new Date().toISOString(),
      };
      const io = getIO();
      if (io) io.emit('road:status_update', updated);
      res.json({ success: true, data: updated });
    }
  }
);

// POST /api/v1/roads - Register new road segment status
roadsRouter.post(
  '/',
  authenticate,
  requireRole('admin', 'barangay_focal', 'first_responder'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, barangay_id, status = 'impassable', flood_depth_level = 'knee', blockage_reason = 'Flood water' } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Road corridor name is required' });
      }

      const sql = `
        INSERT INTO road_segments (
          name, barangay_id, status, flood_depth_level, blockage_reason,
          geometry_geom, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          ST_SetSRID(ST_MakeLine(ST_Point(123.89, 10.31), ST_Point(123.895, 10.315)), 4326),
          NOW()
        ) RETURNING id, name, barangay_id, status, flood_depth_level, blockage_reason, updated_at
      `;

      const result = await query(sql, [
        name,
        barangay_id || null,
        status,
        flood_depth_level,
        blockage_reason,
      ]);

      const newRoad = result.rows[0];
      const io = getIO();
      if (io) io.emit('road:status_update', newRoad);

      res.status(201).json({ success: true, data: newRoad });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/roads/:id - Remove road advisory
roadsRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await query(`DELETE FROM road_segments WHERE id = $1`, [id]);
      const io = getIO();
      if (io) io.emit('road:deleted', { id });
      res.json({ success: true, message: 'Road record removed' });
    } catch (error) {
      next(error);
    }
  }
);

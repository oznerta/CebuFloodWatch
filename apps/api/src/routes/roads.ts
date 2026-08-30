import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getIO } from '../services/socket.js';

export const roadsRouter = Router();

// GET /api/v1/roads - List all road segments and current passability status
roadsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { is_blocked, barangay_id } = req.query;
    let sql = `
      SELECT 
        r.id, 
        r.barangay_id, 
        b.name as barangay_name,
        r.name, 
        r.is_blocked, 
        CASE WHEN r.is_blocked THEN 'impassable' ELSE 'passable' END as status,
        r.block_reason,
        r.blocked_at,
        ST_AsGeoJSON(r.line_geom)::json as geometry,
        r.updated_at,
        r.created_at
      FROM public.road_segments r
      LEFT JOIN public.barangays b ON r.barangay_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (is_blocked !== undefined) {
      params.push(is_blocked === 'true');
      sql += ` AND r.is_blocked = $${params.length}`;
    }
    if (barangay_id) {
      params.push(barangay_id);
      sql += ` AND r.barangay_id = $${params.length}`;
    }

    sql += ` ORDER BY r.name ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching roads:', error);
    next(error);
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
      const { status, is_blocked, block_reason } = req.body;

      const blockedBool = is_blocked !== undefined ? Boolean(is_blocked) : (status === 'impassable' || status === 'blocked');

      const updateRes = await query(
        `
        UPDATE public.road_segments
        SET is_blocked = $1, 
            block_reason = COALESCE($2, block_reason),
            blocked_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
            updated_by = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING 
          id, barangay_id, name, is_blocked,
          CASE WHEN is_blocked THEN 'impassable' ELSE 'passable' END as status,
          block_reason, blocked_at, updated_at
      `,
        [blockedBool, block_reason || null, req.user?.id || null, id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Road segment not found' });
      }

      const updated = updateRes.rows[0];

      // Broadcast real-time road update to map and navigation clients
      const io = getIO();
      if (io) {
        io.emit('road:status_update', updated);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
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
      const { name, barangay_id, is_blocked = false, block_reason, coordinates } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Road corridor name is required' });
      }

      let resolvedBarangayId: string | null = null;
      const bInput = barangay_id || req.body.barangay_name;
      if (bInput && bInput !== 'all' && bInput !== 'citywide') {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bInput);
        if (isUUID) {
          resolvedBarangayId = bInput;
        } else {
          const bRes = await query(`SELECT id FROM public.barangays WHERE LOWER(name) = LOWER($1) LIMIT 1`, [bInput.trim()]);
          if (bRes.rows.length > 0) {
            resolvedBarangayId = bRes.rows[0].id;
          }
        }
      }

      // If coordinates are provided as [[lng, lat], [lng, lat]], construct LineString, else default line in barangay
      let geomSql = `ST_SetSRID(ST_MakeLine(ST_Point(123.89, 10.31), ST_Point(123.895, 10.315)), 4326)`;
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        const points = coordinates.map((c: [number, number]) => `${c[0]} ${c[1]}`).join(', ');
        geomSql = `ST_SetSRID(ST_GeomFromText('LINESTRING(${points})'), 4326)`;
      }

      const sql = `
        INSERT INTO public.road_segments (
          name, barangay_id, is_blocked, block_reason, blocked_at, line_geom, updated_by, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, CASE WHEN $3 = TRUE THEN NOW() ELSE NULL END,
          ${geomSql},
          $5, NOW(), NOW()
        ) RETURNING id, name, barangay_id, is_blocked, block_reason, blocked_at, updated_at
      `;

      const result = await query(sql, [
        name.trim(),
        resolvedBarangayId,
        Boolean(is_blocked),
        block_reason || null,
        req.user?.id || null,
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
      const del = await query(`DELETE FROM public.road_segments WHERE id = $1 RETURNING id`, [id]);
      if (del.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Road segment not found' });
      }
      const io = getIO();
      if (io) io.emit('road:deleted', { id });
      res.json({ success: true, message: 'Road record removed' });
    } catch (error) {
      next(error);
    }
  }
);


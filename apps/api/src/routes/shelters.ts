import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getIO } from '../services/socket.js';

export const sheltersRouter = Router();

// GET /api/v1/shelters - List all evacuation centers
sheltersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barangay_id, status } = req.query;
    let sql = `
      SELECT 
        e.id, 
        e.barangay_id, 
        b.name as barangay_name,
        e.name, 
        e.address, 
        e.max_capacity, 
        e.current_occupancy, 
        e.status, 
        e.contact_person,
        e.contact_number, 
        e.supply_notes,
        ST_Y(e.location_geom) as latitude,
        ST_X(e.location_geom) as longitude,
        e.created_at, 
        e.updated_at
      FROM public.evacuation_centers e
      LEFT JOIN public.barangays b ON e.barangay_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (barangay_id) {
      params.push(barangay_id);
      sql += ` AND e.barangay_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND e.status = $${params.length}`;
    }

    sql += ` ORDER BY e.name ASC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching shelters:', error);
    next(error);
  }
});

// GET /api/v1/shelters/nearest - Find nearest open evacuation centers with capacity via PostGIS KNN
sheltersRouter.get('/nearest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusMeters = parseInt((req.query.radius as string) || '5000', 10);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_COORDINATES', message: 'Valid lat and lng query params are required' },
      });
      return;
    }

    const sql = `
      SELECT 
        e.id, 
        e.barangay_id, 
        b.name as barangay_name,
        e.name, 
        e.address, 
        e.max_capacity, 
        e.current_occupancy, 
        e.status, 
        e.contact_person,
        e.contact_number, 
        e.supply_notes,
        ST_Y(e.location_geom) as latitude,
        ST_X(e.location_geom) as longitude,
        ROUND(ST_DistanceSphere(e.location_geom, ST_SetSRID(ST_Point($1, $2), 4326))::numeric, 1) as distance_meters
      FROM public.evacuation_centers e
      LEFT JOIN public.barangays b ON e.barangay_id = b.id
      WHERE e.status = 'open'
        AND e.current_occupancy < e.max_capacity
        AND ST_DWithin(e.location_geom::geography, ST_SetSRID(ST_Point($1, $2), 4326)::geography, $3)
      ORDER BY e.location_geom <-> ST_SetSRID(ST_Point($1, $2), 4326)
      LIMIT 5
    `;

    const result = await query(sql, [lng, lat, radiusMeters]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error finding nearest shelters:', error);
    next(error);
  }
});

// PATCH /api/v1/shelters/:id/occupancy - Update current occupancy count & auto-manage status
sheltersRouter.patch(
  '/:id/occupancy',
  authenticate,
  requireRole('admin', 'barangay_focal', 'first_responder'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { current_occupancy } = req.body;

      if (typeof current_occupancy !== 'number' || current_occupancy < 0) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_OCCUPANCY', message: 'current_occupancy must be a non-negative number' },
        });
        return;
      }

      const shelterRes = await query(`SELECT max_capacity FROM public.evacuation_centers WHERE id = $1`, [id]);
      if (shelterRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Evacuation center not found' });
      }

      const maxCap = shelterRes.rows[0].max_capacity || 300;
      const newStatus = current_occupancy >= maxCap ? 'full' : 'open';

      const updateRes = await query(
        `
        UPDATE public.evacuation_centers
        SET current_occupancy = $1, status = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *, ST_Y(location_geom) as latitude, ST_X(location_geom) as longitude
      `,
        [current_occupancy, newStatus, id]
      );

      const updated = updateRes.rows[0];

      // Broadcast real-time update to web command portal and mobile clients
      const io = getIO();
      if (io) {
        io.emit('shelter:updated', updated);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/shelters - Create new evacuation center
sheltersRouter.post(
  '/',
  authenticate,
  requireRole('admin', 'barangay_focal'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name, barangay_id, address, max_capacity, contact_person, contact_number, latitude, longitude, supply_notes } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Shelter name is required' });
      }

      let resolvedBarangayId: string | null = null;
      let lat = latitude !== undefined ? parseFloat(latitude) : null;
      let lng = longitude !== undefined ? parseFloat(longitude) : null;

      const bInput = barangay_id || req.body.barangay_name;
      if (bInput && bInput !== 'all' && bInput !== 'citywide') {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bInput);
        if (isUUID) {
          resolvedBarangayId = bInput;
        } else {
          const bRes = await query(`SELECT id, ST_Y(center_geom) as lat, ST_X(center_geom) as lng FROM public.barangays WHERE LOWER(name) = LOWER($1) LIMIT 1`, [bInput.trim()]);
          if (bRes.rows.length > 0) {
            resolvedBarangayId = bRes.rows[0].id;
            if (lat === null || isNaN(lat)) lat = bRes.rows[0].lat;
            if (lng === null || isNaN(lng)) lng = bRes.rows[0].lng;
          }
        }
      }

      // Default to Cebu City center if still missing
      if (lat === null || isNaN(lat)) lat = 10.3157;
      if (lng === null || isNaN(lng)) lng = 123.8854;

      const rawNotes = supply_notes || (req.body.supplies ? `Water: ${req.body.supplies.water_liters || 0}L, Food: ${req.body.supplies.food_packs || 0} packs` : '');

      const sql = `
        INSERT INTO public.evacuation_centers (
          name, barangay_id, address, max_capacity, current_occupancy,
          status, contact_person, contact_number, supply_notes, location_geom, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 0, 'open', $5, $6, $7,
          ST_SetSRID(ST_Point($8, $9), 4326),
          NOW(), NOW()
        ) RETURNING *, ST_Y(location_geom) as latitude, ST_X(location_geom) as longitude
      `;

      const result = await query(sql, [
        name.trim(),
        resolvedBarangayId,
        address || '',
        max_capacity || 300,
        contact_person || '',
        contact_number || '',
        rawNotes,
        lng,
        lat,
      ]);

      const newShelter = result.rows[0];
      const io = getIO();
      if (io) io.emit('shelter:created', newShelter);

      res.status(201).json({ success: true, data: newShelter });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/shelters/:id - Delete an evacuation center
sheltersRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const del = await query(`DELETE FROM public.evacuation_centers WHERE id = $1 RETURNING id`, [id]);
      if (del.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Evacuation center not found' });
      }
      const io = getIO();
      if (io) io.emit('shelter:deleted', { id });
      res.json({ success: true, message: 'Shelter removed successfully' });
    } catch (error) {
      next(error);
    }
  }
);


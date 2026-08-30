import { Router, Request, Response, NextFunction } from 'express';
import { createReportSchema } from '@cebufloodwatch/shared';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { broadcastEvent } from '../services/socket.js';
import { uploadCitizenReportPhoto } from '../services/storage.js';

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

// POST /api/v1/reports/upload - Secure Cloudinary photo upload endpoint
reportsRouter.post('/upload', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { imageBase64, reportId = 'temp' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'No image data provided.' });
    }

    const uploadRes = await uploadCitizenReportPhoto(imageBase64, reportId);
    return res.json({
      success: uploadRes.success,
      url: uploadRes.url,
      publicId: uploadRes.publicId,
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

    // If photo is base64, upload to Cloudinary directly
    let finalPhotoUrl = input.photo_url || null;
    if (finalPhotoUrl && finalPhotoUrl.startsWith('data:image')) {
      const uploadRes = await uploadCitizenReportPhoto(finalPhotoUrl, `citizen_${Date.now()}`);
      if (uploadRes.success) {
        finalPhotoUrl = uploadRes.url;
      }
    }

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
        finalPhotoUrl,
      ]
    );

    const newReport = {
      id: insertRes.rows[0].id,
      latitude: input.latitude,
      longitude: input.longitude,
      flood_depth_level: input.flood_depth_level,
      description: input.description,
      photo_url: finalPhotoUrl,
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

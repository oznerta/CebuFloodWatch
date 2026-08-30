import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { generateBilingualAlert } from '../services/ai.js';
import { sendTargetedAlertFCM } from '../services/fcm.js';
import { getIO } from '../services/socket.js';

export const alertsRouter = Router();

// GET /api/v1/alerts/active - List all currently active emergency alerts
alertsRouter.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT 
        a.id, a.barangay_id, b.name as barangay_name, a.severity,
        a.title_en, a.title_tl, a.body_en, a.body_tl,
        a.status, a.is_ai_drafted, a.published_at, a.created_at,
        u.full_name as author_name
      FROM public.alerts a
      LEFT JOIN public.barangays b ON a.barangay_id = b.id
      LEFT JOIN public.users u ON a.author_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    next(error);
  }
});

// GET /api/v1/alerts/history - List broadcast history
alertsRouter.get('/history', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT 
        a.id, a.barangay_id, b.name as barangay_name, a.severity,
        a.title_en, a.title_tl, a.body_en, a.body_tl,
        a.status, a.is_ai_drafted, a.published_at, a.created_at,
        u.full_name as author_name
      FROM public.alerts a
      LEFT JOIN public.barangays b ON a.barangay_id = b.id
      LEFT JOIN public.users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching alerts history:', error);
    next(error);
  }
});

// POST /api/v1/alerts/generate-draft - AI-assisted drafting with Google Gemini
alertsRouter.post(
  '/generate-draft',
  authenticate,
  requireRole('admin', 'barangay_focal'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { raw_notes, barangay_name, severity_hint } = req.body;

      if (!raw_notes || raw_notes.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_NOTES', message: 'raw_notes is required to draft an alert' },
        });
        return;
      }

      const draft = await generateBilingualAlert(raw_notes, barangay_name, severity_hint);
      res.json({ success: true, data: draft });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/alerts/publish - Publish reviewed alert and broadcast to FCM topics & WebSockets
alertsRouter.post(
  '/publish',
  authenticate,
  requireRole('admin', 'barangay_focal'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { barangay_id, severity, title_en, title_tl, body_en, body_tl, is_ai_drafted, raw_prompt_input } = req.body;

      if (!title_en || !body_en || !severity) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PAYLOAD', message: 'title_en, body_en, and severity are required' },
        });
        return;
      }

      const authorId = req.user?.id || '00000000-0000-4000-8000-000000000001';

      // Resolve barangay_id UUID if a name was provided
      let resolvedBarangayId: string | null = null;
      if (barangay_id && barangay_id !== 'all' && barangay_id !== 'citywide') {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(barangay_id);
        if (isUUID) {
          resolvedBarangayId = barangay_id;
        } else {
          const bRes = await query(`SELECT id FROM public.barangays WHERE LOWER(name) = LOWER($1) LIMIT 1`, [barangay_id.trim()]);
          if (bRes.rows.length > 0) {
            resolvedBarangayId = bRes.rows[0].id;
          }
        }
      }

      const sql = `
        INSERT INTO public.alerts (
          author_id, barangay_id, severity, 
          title_en, title_tl, body_en, body_tl,
          raw_prompt_input, is_ai_drafted,
          status, published_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', NOW(), NOW())
        RETURNING *
      `;

      const result = await query(sql, [
        authorId,
        resolvedBarangayId,
        severity,
        title_en.trim(),
        (title_tl || title_en).trim(),
        body_en.trim(),
        (body_tl || body_en).trim(),
        raw_prompt_input || null,
        Boolean(is_ai_drafted),
      ]);

      const newAlert = result.rows[0];

      // 1. Dispatch Targeted FCM Push Notification
      try {
        await sendTargetedAlertFCM({
          title: title_en,
          body: body_en,
          severity,
          alert_id: newAlert.id,
          barangay_id: newAlert.barangay_id,
        });
      } catch (fcmErr: any) {
        console.warn('FCM dispatch warning:', fcmErr.message);
      }

      // 2. Broadcast over WebSockets to all connected Command Portals & Mobile apps
      const io = getIO();
      if (io) {
        io.emit('alert:new', newAlert);
      }

      res.status(201).json({
        success: true,
        data: newAlert,
      });
    } catch (error) {
      next(error);
    }
  }
);

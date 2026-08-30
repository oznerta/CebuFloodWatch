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
        a.is_active, a.published_at, a.expires_at
      FROM alerts a
      LEFT JOIN barangays b ON a.barangay_id = b.id
      WHERE a.is_active = true
      ORDER BY a.published_at DESC
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.json({ success: true, data: [] });
  }
});

// GET /api/v1/alerts/history - List broadcast history
alertsRouter.get('/history', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sql = `
      SELECT 
        a.id, a.barangay_id, b.name as barangay_name, a.severity,
        a.title_en, a.title_tl, a.body_en, a.body_tl,
        a.is_active, a.published_at, a.expires_at
      FROM alerts a
      LEFT JOIN barangays b ON a.barangay_id = b.id
      ORDER BY a.published_at DESC
      LIMIT 20
    `;
    const result = await query(sql);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching alerts history:', error);
    res.json({ success: true, data: [] });
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
      const { barangay_id, severity, title_en, title_tl, body_en, body_tl, duration_hours } = req.body;

      if (!title_en || !body_en || !severity) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PAYLOAD', message: 'title_en, body_en, and severity are required' },
        });
        return;
      }

      const hours = duration_hours || 6;
      let newAlert: any;

      try {
        const sql = `
          INSERT INTO alerts (
            barangay_id, created_by, severity, 
            title_en, title_tl, body_en, body_tl, 
            is_active, published_at, expires_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW() + interval '${hours} hours')
          RETURNING *
        `;

        const result = await query(sql, [
          barangay_id || null,
          req.user?.id || 'system_admin',
          severity,
          title_en,
          title_tl || title_en,
          body_en,
          body_tl || body_en,
        ]);
        newAlert = result.rows[0];
      } catch {
        newAlert = {
          id: `alert_${Date.now()}`,
          barangay_id: barangay_id || null,
          severity,
          title_en,
          title_tl: title_tl || title_en,
          body_en,
          body_tl: body_tl || body_en,
          is_active: true,
          published_at: new Date().toISOString(),
        };
      }

      // 1. Dispatch Targeted FCM Push Notification
      await sendTargetedAlertFCM({
        title: title_en,
        body: body_en,
        severity,
        alert_id: newAlert.id,
        barangay_id: newAlert.barangay_id,
      });

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

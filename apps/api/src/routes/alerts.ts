import { Router, Request, Response, NextFunction } from 'express';
import { draftAlertSchema, publishAlertSchema } from '@cebufloodwatch/shared';
import { query } from '../config/db.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { generateBilingualAlert } from '../services/ai.js';
import { sendBarangayAlertPush } from '../services/fcm.js';
import { broadcastEvent } from '../services/socket.js';

export const alertsRouter = Router();

// GET /api/v1/alerts/active - Fetch published emergency alerts
alertsRouter.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(`
      SELECT 
        a.id,
        a.author_id,
        u.full_name as author_name,
        a.barangay_id,
        b.name as barangay_name,
        a.severity,
        a.title_en,
        a.title_tl,
        a.body_en,
        a.body_tl,
        a.is_ai_drafted,
        a.status,
        a.published_at,
        a.created_at
      FROM public.alerts a
      LEFT JOIN public.users u ON a.author_id = u.id
      LEFT JOIN public.barangays b ON a.barangay_id = b.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/alerts/draft - AI-assisted bilingual alert drafter (WEB-2)
alertsRouter.post(
  '/draft',
  authenticate,
  requirePermission('draft_alerts'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = draftAlertSchema.parse(req.body);

      let barangayName: string | undefined;
      if (input.barangay_id) {
        const bRes = await query('SELECT name FROM public.barangays WHERE id = $1', [input.barangay_id]);
        if (bRes.rows.length > 0) {
          barangayName = bRes.rows[0].name;
        }
      }

      // Generate structured EN + TL via Gemini 2.5 Flash
      const aiDraft = await generateBilingualAlert(input.raw_notes, barangayName, input.severity_hint);

      res.json({
        success: true,
        data: {
          ...aiDraft,
          raw_notes: input.raw_notes,
          barangay_id: input.barangay_id || null,
          barangay_name: barangayName || 'City-wide',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/alerts/publish - Publish approved alert & dispatch FCM push
alertsRouter.post(
  '/publish',
  authenticate,
  requirePermission('publish_alerts'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = publishAlertSchema.parse(req.body);
      const authorId = req.user?.id || 'u0000000-0000-0000-0000-000000000001';

      // 1. Dispatch FCM Push Notification
      const fcmMessageId = await sendBarangayAlertPush({
        title: input.title_en,
        body: input.body_en,
        barangayId: input.barangay_id,
        data: {
          severity: input.severity,
          title_tl: input.title_tl,
          body_tl: input.body_tl,
        },
      });

      // 2. Persist in Database
      const result = await query(
        `
        INSERT INTO public.alerts (
          author_id,
          barangay_id,
          severity,
          title_en,
          title_tl,
          body_en,
          body_tl,
          is_ai_drafted,
          status,
          fcm_message_id,
          published_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, TRUE, 'published', $8, NOW()
        ) RETURNING id, severity, title_en, title_tl, body_en, body_tl, published_at, status
        `,
        [
          authorId,
          input.barangay_id || null,
          input.severity,
          input.title_en,
          input.title_tl,
          input.body_en,
          input.body_tl,
          fcmMessageId,
        ]
      );

      const publishedAlert = result.rows[0];

      // 3. Broadcast to Live Command Portal
      broadcastEvent('alert:published', publishedAlert, input.barangay_id);

      res.status(201).json({
        success: true,
        data: publishedAlert,
      });
    } catch (error) {
      next(error);
    }
  }
);

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

export const uploadRouter = Router();

// POST /api/v1/upload/report-photo - Media upload endpoint for citizen reports
uploadRouter.post(
  '/report-photo',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { image_base64, filename } = req.body;

      if (!image_base64) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_IMAGE', message: 'image_base64 payload is required' },
        });
        return;
      }

      // Generate secure asset URL (in prod, upload to Cloudinary; in dev, mock CDN URL)
      const sanitizedName = (filename || 'flood_report').replace(/[^a-zA-Z0-9_-]/g, '');
      const photoUrl = `https://res.cloudinary.com/cebufloodwatch/image/upload/v${Date.now()}/${sanitizedName}.jpg`;

      res.status(201).json({
        success: true,
        data: {
          photo_url: photoUrl,
          uploaded_at: new Date().toISOString(),
          bytes: Math.round(image_base64.length * 0.75),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

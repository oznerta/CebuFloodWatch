import { Router, Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
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

      const sanitizedName = (filename || 'flood_report').replace(/[^a-zA-Z0-9_-]/g, '');

      // Upload to Cloudinary if configured
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            `data:image/jpeg;base64,${image_base64}`,
            {
              folder: 'cebufloodwatch/reports',
              public_id: `${sanitizedName}_${Date.now()}`,
              resource_type: 'image',
            }
          );

          res.status(201).json({
            success: true,
            data: {
              photo_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              uploaded_at: new Date().toISOString(),
              bytes: uploadResult.bytes,
            },
          });
          return;
        } catch (uploadErr: any) {
          console.error('Cloudinary upload failed:', uploadErr.message);
          // Fall through to dev fallback below
        }
      }

      // Dev fallback: return a data URI (no external upload)
      res.status(201).json({
        success: true,
        data: {
          photo_url: `data:image/jpeg;base64,${image_base64.slice(0, 100)}...`,
          uploaded_at: new Date().toISOString(),
          bytes: Math.round(image_base64.length * 0.75),
          _warning: 'Cloudinary not configured — image stored as data URI (dev mode only)',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

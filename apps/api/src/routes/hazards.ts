import { Router, Request, Response } from 'express';
import { UP_NOAH_CEBU_HAZARD_GEOJSON } from '@cebufloodwatch/shared';

export const hazardsRouter = Router();

// GET /api/v1/hazards/cebu-layers - Fetch UP NOAH flood hazard layers
hazardsRouter.get('/cebu-layers', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h cache
  res.json({
    success: true,
    data: UP_NOAH_CEBU_HAZARD_GEOJSON,
  });
});

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { recomputeIncidentClusters, getFallbackClusters } from '../services/clustering.js';
import { getIO } from '../services/socket.js';

export const clustersRouter = Router();

// In-memory cluster store for fast retrieval & status management
let activeClustersStore = getFallbackClusters();

// GET /api/v1/clusters/active - List all active deduplicated incident clusters
clustersRouter.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const clusters = await recomputeIncidentClusters();
    activeClustersStore = clusters.length > 0 ? clusters : activeClustersStore;
    res.json({ success: true, data: activeClustersStore });
  } catch (error) {
    res.json({ success: true, data: activeClustersStore });
  }
});

// POST /api/v1/clusters/recompute - Force recomputation of incident clusters
clustersRouter.post(
  '/recompute',
  authenticate,
  requireRole('admin', 'barangay_focal'),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      activeClustersStore = await recomputeIncidentClusters();
      const io = getIO();
      if (io) {
        io.emit('clusters:recomputed', activeClustersStore);
      }
      res.json({ success: true, data: activeClustersStore });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/v1/clusters/:id/status - Update incident cluster resolution status
clustersRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('admin', 'barangay_focal', 'first_responder'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'responding', 'resolved'].includes(status)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'status must be active, responding, or resolved' },
        });
        return;
      }

      activeClustersStore = activeClustersStore.map((c) =>
        c.id === id ? { ...c, status } : c
      );

      const target = activeClustersStore.find((c) => c.id === id) || { id, status };

      const io = getIO();
      if (io) {
        io.emit('cluster:status_update', target);
      }

      res.json({ success: true, data: target });
    } catch (error) {
      next(error);
    }
  }
);

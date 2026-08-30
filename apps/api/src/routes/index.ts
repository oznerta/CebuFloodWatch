import { Router } from 'express';
import { healthRouter } from './health.js';
import { barangaysRouter } from './barangays.js';
import { reportsRouter } from './reports.js';
import { sheltersRouter } from './shelters.js';
import { roadsRouter } from './roads.js';
import { alertsRouter } from './alerts.js';
import { hazardsRouter } from './hazards.js';
import { uploadRouter } from './upload.js';
import { clustersRouter } from './clusters.js';
import { telemetryRouter } from './telemetry.js';
import { auditRouter } from './audit.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { configRouter } from './config.js';

export const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/config', configRouter);
apiRouter.use('/barangays', barangaysRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/shelters', sheltersRouter);
apiRouter.use('/roads', roadsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/hazards', hazardsRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/clusters', clustersRouter);
apiRouter.use('/telemetry', telemetryRouter);
apiRouter.use('/audit', auditRouter);
apiRouter.use('/admin', adminRouter);


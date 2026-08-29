import { Router } from 'express';
import { healthRouter } from './health.js';
import { barangaysRouter } from './barangays.js';
import { reportsRouter } from './reports.js';
import { sheltersRouter } from './shelters.js';
import { roadsRouter } from './roads.js';
import { alertsRouter } from './alerts.js';

export const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/barangays', barangaysRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/shelters', sheltersRouter);
apiRouter.use('/roads', roadsRouter);
apiRouter.use('/alerts', alertsRouter);

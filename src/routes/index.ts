import { Router } from 'express';
import authRoutes from './auth.routes';
import vmRoutes from './vm.routes';
import healthRoutes from './health.routes';
import metricsRoutes from './metrics.routes';

const router = Router();

// New API routes (with /api prefix)
router.use('/auth', authRoutes);
router.use('/vm', vmRoutes);
router.use('/health', healthRoutes);
router.use('/metrics', metricsRoutes);

export default router;

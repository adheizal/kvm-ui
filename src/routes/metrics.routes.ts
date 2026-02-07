import { Router, Request, Response } from 'express';
import { register } from '@/config/metrics';

const router = Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Returns application metrics in Prometheus format for scraping
 *     tags: [Monitoring]
 *     security: []
 *     produces:
 *       - text/plain
 *     responses:
 *       200:
 *         description: Metrics in Prometheus exposition format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP kvm_ui_http_request_duration_seconds Duration of HTTP requests in seconds
 *                 # TYPE kvm_ui_http_request_duration_seconds histogram
 *                 kvm_ui_http_request_duration_seconds_bucket{le="0.001"} 0
 *                 ...
 *       503:
 *         description: Service unavailable
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error: any) {
    res.status(503).end(error.message);
  }
});

export default router;

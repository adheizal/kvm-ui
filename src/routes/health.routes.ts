import { Router } from 'express';
import { testDatabaseConnection } from '@/config/database';
import { testRedisConnection } from '@/config/redis';
import { redis } from '@/config/redis';
import { pool } from '@/config/database';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: All systems operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-01T00:00:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [up, down]
 *                       example: up
 *                     redis:
 *                       type: string
 *                       enum: [up, down]
 *                       example: up
 *       503:
 *         description: One or more systems down
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: unhealthy
 */
router.get('/', async (_req, res) => {
  const dbHealth = await testDatabaseConnection();
  const redisHealth = await testRedisConnection();

  const health = {
    status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: dbHealth ? 'up' : 'down',
      redis: redisHealth ? 'up' : 'down',
    },
  };

  res.status(dbHealth && redisHealth ? 200 : 503).json(health);
});

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed health check with diagnostics
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Detailed health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-01T00:00:00.000Z
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: up
 *                     currentTime:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-01T00:00:00.000Z
 *                 redis:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: up
 *                     response:
 *                       type: string
 *                       example: PONG
 *                 memory:
 *                   type: object
 *                   properties:
 *                     rss:
 *                       type: number
 *                       example: 12345678
 *                     heapTotal:
 *                       type: number
 *                       example: 9876543
 *                     heapUsed:
 *                       type: number
 *                       example: 5432109
 *                     external:
 *                       type: number
 *                       example: 123456
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *       503:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 error:
 *                   type: string
 *                   example: Connection refused
 */
router.get('/detailed', async (_req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    const redisResult = await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'up',
        currentTime: dbResult.rows[0].now,
      },
      redis: {
        status: 'up',
        response: redisResult,
      },
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestsTotal } from '@/config/metrics';

export function performanceMetrics(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Hook into response finish to capture duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode;

    // Convert to seconds for Prometheus histogram
    const durationInSeconds = duration / 1000;

    // Record metrics
    httpRequestDuration.labels(method, route, statusCode.toString()).observe(durationInSeconds);

    httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
  });

  next();
}

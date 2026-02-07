import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { rateLimiter } from './middlewares/rate-limit.middleware';
import { performanceMetrics } from './middlewares/performance.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export function createApp(): Application {
  const app = express();

  // Security middleware - DISABLED in development to avoid HSTS issues
  if (config.env === 'production') {
    // Only enable strict security in production
    app.use(helmet());
  } else {
    // Development: Relax security headers
    app.use(
      helmet({
        contentSecurityPolicy: false, // Disable CSP in dev
        hsts: false, // Disable HSTS in dev - THIS WAS THE ISSUE
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        originAgentCluster: false,
      })
    );
  }

  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Performance metrics (must be before routes)
  app.use(performanceMetrics);

  // Rate limiting
  app.use(rateLimiter);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // New API routes (with /api prefix)
  app.use('/api', routes);

  // Swagger API Documentation
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'KVM-UI API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );

  // Serve React frontend (build)
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));

  // Serve React app for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  // Error handling
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

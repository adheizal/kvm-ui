import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/error.middleware';
import { performanceMetrics } from './middlewares/performance.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export function createApp(): Application {
  const app = express();

  // Trust proxy - Required for Cloudflare Tunnel to get correct client IP
  app.set('trust proxy', true);

  // Security middleware - DISABLED in development to avoid HSTS issues
  if (config.env === 'production') {
    // Production: Configure CSP to allow same-origin and configured APP_URL
    const appUrl = config.app.url || '*';
    const cspDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", appUrl, 'ws:', 'wss:'],
      'font-src': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'frame-src': ["'none'"],
    };

    // Always allow localhost connections for development/admin access
    // This is needed when accessing via Cloudflare Tunnel but API runs on localhost
    cspDirectives['connect-src'].push(
      'http://localhost:*',
      'http://127.0.0.1:*',
      'ws://localhost:*',
      'ws://127.0.0.1:*'
    );

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: cspDirectives,
        },
      })
    );
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

  // Rate limiting - DISABLED when using Cloudflare Tunnel to avoid trust proxy issues
  // Cloudflare already provides DDoS protection at the edge
  // app.use(rateLimiter);

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

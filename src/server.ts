import { createApp } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { initializeWebSocket } from './config/websocket';

// Initialize HyperDX if API key is provided
if (config.monitoring.hyperdxApiKey) {
  try {
    const HyperDX = require('@hyperdx/node-opentelemetry');
    HyperDX.init({
      apiKey: config.monitoring.hyperdxApiKey,
      service: 'kvm-ui',
    });
    logger.info('HyperDX monitoring initialized');
  } catch (error) {
    logger.warn('Failed to initialize HyperDX:', error);
  }
}

async function startServer() {
  try {
    // Test connections
    logger.info('Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    logger.info('Testing Redis connection...');
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      throw new Error('Redis connection failed');
    }

    // Create and start app
    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info(`Server is listening on http://0.0.0.0:${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info('Press CTRL-C to stop');
    });

    // Initialize WebSocket
    initializeWebSocket(server);
    logger.info('WebSocket server initialized');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

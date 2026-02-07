import Redis from 'ioredis';
import { URL } from 'url';
import { config } from './env';

const redisUrl = new URL(
  `${config.redis.tls ? 'rediss' : 'redis'}://${config.redis.user ? `${encodeURIComponent(config.redis.user)}:` : ''}${encodeURIComponent(config.redis.password)}@${config.redis.host}:${config.redis.port}`
);

const useTls = redisUrl.protocol === 'rediss:';

let tlsOptions = undefined;
if (useTls) {
  tlsOptions = {
    servername: config.redis.host,
    ca: config.redis.ca ? [config.redis.ca] : undefined,
    rejectUnauthorized: config.redis.rejectUnauthorized,
  };
}

export const redis = new Redis(redisUrl.toString(), {
  family: 4,
  tls: tlsOptions,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redis.on('connect', () => console.log('Redis: connecting...'));
redis.on('ready', () => console.log('Redis: ready'));
redis.on('error', (err) => console.error('Redis error:', err));
redis.on('close', () => console.warn('Redis: connection closed'));

export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    console.log('Redis: connection successful');
    return true;
  } catch (error) {
    console.error('Redis: connection failed', error);
    return false;
  }
}

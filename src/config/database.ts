import { Pool, PoolConfig } from 'pg';
import { config } from './env';

export const poolConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl
    ? {
        rejectUnauthorized: false,
      }
    : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  max: 20,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  console.log('Database: connecting...');
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Database: connection successful');
    return true;
  } catch (error) {
    console.error('Database: connection failed', error);
    return false;
  }
}

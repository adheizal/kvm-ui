import { Pool } from 'pg';
import { config } from '../src/config/env';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '../src/utils/logger';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  try {
    logger.info('Starting migrations...');

    // Create migrations tracking table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_file VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationsDir = join(__dirname);
    const files = await readdir(migrationsDir);
    const migrationFiles = files.filter((f) => f.endsWith('.sql') && f !== 'migrate.ts').sort();

    logger.info(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      // Check if migration already ran
      const existing = await pool.query(
        'SELECT * FROM schema_migrations WHERE migration_file = $1',
        [file]
      );

      if (existing.rows.length > 0) {
        logger.info(`Skipping ${file} (already executed)`);
        continue;
      }

      logger.info(`Running migration: ${file}`);
      const migrationPath = join(migrationsDir, file);
      const fs = await import('fs');
      const sql = fs.readFileSync(migrationPath, 'utf8');

      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query('INSERT INTO schema_migrations (migration_file) VALUES ($1)', [file]);
        await pool.query('COMMIT');
        logger.info(`Migration ${file} completed successfully`);
      } catch (error) {
        await pool.query('ROLLBACK');
        logger.error(`Migration ${file} failed:`, error);
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

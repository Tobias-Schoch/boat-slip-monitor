import dotenv from 'dotenv';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { DATABASE_CONFIG, logger } from '@website-monitor/shared';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL || DATABASE_CONFIG.URL;
  logger.info('Using DATABASE_URL:', dbUrl);
  const sql = postgres(dbUrl, { max: 1 });

  try {
    logger.info('Starting database migration...');

    // Read all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure 001, 002, 003... run in order

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Execute each migration
    for (const file of migrationFiles) {
      logger.info(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      await sql.unsafe(migrationSQL);
      logger.info(`Completed migration: ${file}`);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', { error });
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('All migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed', { error });
      process.exit(1);
    });
}

export { runMigrations };

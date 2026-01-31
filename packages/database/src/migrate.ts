import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { DATABASE_CONFIG, logger } from '@boat-monitor/shared';

async function runMigrations() {
  const sql = postgres(DATABASE_CONFIG.URL, { max: 1 });

  try {
    logger.info('Starting database migration...');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await sql.unsafe(migrationSQL);

    logger.info('Migration completed successfully');
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

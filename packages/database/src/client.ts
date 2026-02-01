import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DATABASE_CONFIG, logger } from '@website-monitor/shared';
import * as schema from './schema';

const connectionString = DATABASE_CONFIG.URL;

// Create postgres client
const queryClient = postgres(connectionString, {
  max: DATABASE_CONFIG.POOL_SIZE,
  idle_timeout: 20,
  connect_timeout: DATABASE_CONFIG.CONNECTION_TIMEOUT_MS / 1000,
  onnotice: () => {}
});

// Create drizzle instance
export const db = drizzle(queryClient, { schema });

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    logger.info('Database connection healthy');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await queryClient.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', { error });
  }
}

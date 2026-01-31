// MUST be first import to load .env before anything else
import './env-loader';

import { createModuleLogger } from '@boat-monitor/shared';
import { checkDatabaseConnection, closeDatabaseConnection } from '@boat-monitor/database';
import { checkQueueHealth, closeQueues } from './scheduler/queue';
import { playwrightManager } from './scraper/playwright-manager';
import { scheduleCronJobs } from './scheduler/cron';
import { sendStartupNotification } from './services/startup-notification';
import './scheduler/monitor-job'; // Initialize worker

const logger = createModuleLogger('Monitor');

async function startMonitor() {
  try {
    logger.info('Starting Boat Slip Monitor...');

    // Check database connection
    const dbHealthy = await checkDatabaseConnection();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    // Check queue connection
    const queueHealthy = await checkQueueHealth();
    if (!queueHealthy) {
      throw new Error('Queue connection failed');
    }

    // Initialize Playwright
    await playwrightManager.initialize();

    // Schedule cron jobs
    await scheduleCronJobs();

    logger.info('Boat Slip Monitor started successfully');
    logger.info('System is now monitoring for changes...');

    // Send startup notification
    await sendStartupNotification();
  } catch (error) {
    logger.error('Failed to start monitor', { error });
    process.exit(1);
  }
}

async function stopMonitor() {
  try {
    logger.info('Stopping Boat Slip Monitor...');

    await playwrightManager.close();
    await closeQueues();
    await closeDatabaseConnection();

    logger.info('Boat Slip Monitor stopped');
    process.exit(0);
  } catch (error) {
    logger.error('Error stopping monitor', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', stopMonitor);
process.on('SIGTERM', stopMonitor);

// Start the monitor
startMonitor();

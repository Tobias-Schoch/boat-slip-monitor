// MUST be first import to load .env before anything else
import './env-loader';

import { createModuleLogger } from '@website-monitor/shared';
import { checkDatabaseConnection, closeDatabaseConnection } from '@website-monitor/database';
import { checkQueueHealth, closeQueues } from './scheduler/queue';
import { playwrightManager } from './scraper/playwright-manager';
import { scheduleCronJobs } from './scheduler/cron';
import { sendStartupNotification } from './services/startup-notification';
import { validateStartup } from './utils/startup-validator';
import './scheduler/monitor-job'; // Initialize worker

const logger = createModuleLogger('Monitor');

async function startMonitor() {
  try {
    logger.info('🚀 Starting Website Change Monitor...');

    // Run startup validation
    const validation = await validateStartup();
    if (!validation.valid) {
      logger.error('Startup validation failed. Fix the errors above and restart.');
      process.exit(1);
    }

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

    // Send startup notification
    await sendStartupNotification();

    logger.info('✅ Website Change Monitor is running!');
  } catch (error) {
    logger.error('Failed to start monitor', { error });
    process.exit(1);
  }
}

async function stopMonitor() {
  try {
    await playwrightManager.close();
    await closeQueues();
    await closeDatabaseConnection();

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

import { checkQueue } from './queue';
import { MonitoredUrlsRepository } from '@boat-monitor/database';
import { createModuleLogger, APP_CONFIG } from '@boat-monitor/shared';

const logger = createModuleLogger('Cron');
const urlsRepo = new MonitoredUrlsRepository();

export async function scheduleCronJobs(): Promise<void> {
  try {
    logger.info('Setting up cron jobs...');

    // Schedule repeatable job every 5 minutes
    await checkQueue.add(
      'check-all-urls',
      {},
      {
        repeat: {
          pattern: `*/${APP_CONFIG.CHECK_INTERVAL_MINUTES} * * * *`
        },
        jobId: 'check-all-urls-cron'
      }
    );

    logger.info(`Cron job scheduled: check every ${APP_CONFIG.CHECK_INTERVAL_MINUTES} minutes`);
  } catch (error) {
    logger.error('Failed to schedule cron jobs', { error });
    throw error;
  }
}

export async function triggerCheckAll(): Promise<void> {
  try {
    logger.info('Triggering check for all enabled URLs');

    const enabledUrls = await urlsRepo.findEnabled();

    for (const url of enabledUrls) {
      await checkQueue.add(
        'check-url',
        {
          urlId: url.id,
          url: url.url
        },
        {
          jobId: `check-${url.id}-${Date.now()}`
        }
      );

      logger.info('Check queued', { urlId: url.id, url: url.url });
    }

    logger.info(`Queued ${enabledUrls.length} check jobs`);
  } catch (error) {
    logger.error('Failed to trigger check all', { error });
    throw error;
  }
}

// Listen for cron trigger
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { REDIS_CONFIG } from '@boat-monitor/shared';

const cronWorker = new Worker(
  'check-queue',
  async (job) => {
    if (job.name === 'check-all-urls') {
      await triggerCheckAll();
    }
  },
  {
    connection: new IORedis({
      host: REDIS_CONFIG.HOST,
      port: REDIS_CONFIG.PORT,
      password: REDIS_CONFIG.PASSWORD,
      maxRetriesPerRequest: null
    })
  }
);

logger.info('Cron worker initialized');

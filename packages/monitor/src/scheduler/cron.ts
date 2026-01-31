import { checkQueue } from './queue';
import { MonitoredUrlsRepository } from '@boat-monitor/database';
import { createModuleLogger, APP_CONFIG } from '@boat-monitor/shared';
import cron from 'node-cron';

const logger = createModuleLogger('Cron');
const urlsRepo = new MonitoredUrlsRepository();

export async function scheduleCronJobs(): Promise<void> {
  try {
    logger.info('Setting up cron jobs...');

    // Schedule cron job using node-cron (not BullMQ)
    cron.schedule(`*/${APP_CONFIG.CHECK_INTERVAL_MINUTES} * * * *`, async () => {
      logger.info('Cron triggered - checking all URLs');
      await triggerCheckAll();
    });

    logger.info(`Cron job scheduled: check every ${APP_CONFIG.CHECK_INTERVAL_MINUTES} minutes`);

    // Trigger initial check immediately
    logger.info('Triggering initial check on startup...');
    await triggerCheckAll();
  } catch (error) {
    logger.error('Failed to schedule cron jobs', { error });
    throw error;
  }
}

export async function triggerCheckAll(): Promise<void> {
  try {
    logger.info('Triggering check for all enabled URLs');

    const enabledUrls = await urlsRepo.findEnabled();

    // Add all checks to queue sequentially with small delay
    for (const url of enabledUrls) {
      await checkQueue.add(
        'check-url',
        {
          urlId: url.id,
          url: url.url
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

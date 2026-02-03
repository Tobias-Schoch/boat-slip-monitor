import { checkQueue } from './queue';
import { MonitoredUrlsRepository } from '@boat-monitor/database';
import { createModuleLogger, APP_CONFIG } from '@boat-monitor/shared';
import cron from 'node-cron';

const logger = createModuleLogger('Cron');
const urlsRepo = new MonitoredUrlsRepository();

export async function scheduleCronJobs(): Promise<void> {
  try {
    // Working hours (7:00-17:59): Every 5 minutes
    cron.schedule('*/5 7-17 * * *', async () => {
      logger.info('Checking during working hours (5min interval)');
      await triggerCheckAll();
    });

    // Outside working hours - Early morning (0:00-6:59): Every 3 minutes
    cron.schedule('*/3 0-6 * * *', async () => {
      logger.info('Checking outside working hours (3min interval)');
      await triggerCheckAll();
    });

    // Outside working hours - Evening/Night (18:00-23:59): Every 3 minutes
    cron.schedule('*/3 18-23 * * *', async () => {
      logger.info('Checking outside working hours (3min interval)');
      await triggerCheckAll();
    });

    logger.info('Cron jobs scheduled: 5min (7-18h), 3min (outside working hours)');

    // Trigger initial check immediately
    await triggerCheckAll();
  } catch (error) {
    logger.error('Failed to schedule cron jobs', { error });
    throw error;
  }
}

export async function triggerCheckAll(): Promise<void> {
  try {
    const enabledUrls = await urlsRepo.findEnabled();

    // Add all checks to queue sequentially
    for (const url of enabledUrls) {
      await checkQueue.add(
        'check-url',
        {
          urlId: url.id,
          url: url.url
        }
      );
    }
  } catch (error) {
    logger.error('Failed to trigger check all', { error });
    throw error;
  }
}

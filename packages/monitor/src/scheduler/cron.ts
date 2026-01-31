import { checkQueue } from './queue';
import { MonitoredUrlsRepository } from '@boat-monitor/database';
import { createModuleLogger, APP_CONFIG } from '@boat-monitor/shared';
import cron from 'node-cron';

const logger = createModuleLogger('Cron');
const urlsRepo = new MonitoredUrlsRepository();

export async function scheduleCronJobs(): Promise<void> {
  try {
    // Schedule cron job using node-cron (not BullMQ)
    cron.schedule(`*/${APP_CONFIG.CHECK_INTERVAL_MINUTES} * * * *`, async () => {
      await triggerCheckAll();
    });

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

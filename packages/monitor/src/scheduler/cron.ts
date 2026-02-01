import { checkQueue } from './queue';
import { MonitoredUrlsRepository } from '@boat-monitor/database';
import { createModuleLogger, APP_CONFIG } from '@boat-monitor/shared';
import cron from 'node-cron';

const logger = createModuleLogger('Cron');
const urlsRepo = new MonitoredUrlsRepository();

export async function scheduleCronJobs(): Promise<void> {
  try {
    // Peak hours (5:00-19:00): Every 5 minutes
    cron.schedule('*/5 5-18 * * *', async () => {
      await triggerCheckAll();
    });

    // Night peak (23:30-23:59): Every 5 minutes
    cron.schedule('30,35,40,45,50,55 23 * * *', async () => {
      await triggerCheckAll();
    });

    // Night peak continued (00:00-00:30): Every 5 minutes
    cron.schedule('0,5,10,15,20,25,30 0 * * *', async () => {
      await triggerCheckAll();
    });

    // Off-peak hours (remaining times): Every 15 minutes
    // 00:31-04:59 and 19:00-23:29
    cron.schedule('*/15 1-4 * * *', async () => {
      await triggerCheckAll();
    });

    cron.schedule('0,15,30,45 19-22 * * *', async () => {
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

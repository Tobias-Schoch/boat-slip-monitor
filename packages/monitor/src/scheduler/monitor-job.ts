import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import {
  REDIS_CONFIG,
  createModuleLogger,
  CheckStatus,
  hashContent
} from '@boat-monitor/shared';
import {
  MonitoredUrlsRepository,
  ChecksRepository,
  ChangesRepository,
  db
} from '@boat-monitor/database';
import { pageScraper } from '../scraper/page-scraper';
import { changeDetector } from '../detector/change-detector';
import { notificationDispatcher } from '../notifier/notification-dispatcher';
import { eq } from 'drizzle-orm';
import { htmlSnapshots } from '@boat-monitor/database';

const logger = createModuleLogger('MonitorJob');

const urlsRepo = new MonitoredUrlsRepository();
const checksRepo = new ChecksRepository();
const changesRepo = new ChangesRepository();

interface CheckJobData {
  urlId: string;
  url: string;
}

export const monitorWorker = new Worker<CheckJobData>(
  'check-queue',
  async (job: Job<CheckJobData>) => {
    const { urlId, url } = job.data;

    logger.info('Starting check job', { urlId, url });

    try {
      // Scrape the page
      const scrapeResult = await pageScraper.scrape(url);

      if (!scrapeResult.success) {
        // Record failed check
        await checksRepo.create({
          urlId,
          status: CheckStatus.FAILED,
          responseTime: scrapeResult.responseTime,
          statusCode: scrapeResult.statusCode,
          error: scrapeResult.error
        });

        logger.error('Check failed', { urlId, url, error: scrapeResult.error });
        return { success: false, error: scrapeResult.error };
      }

      // Record successful check
      const check = await checksRepo.create({
        urlId,
        status: CheckStatus.SUCCESS,
        responseTime: scrapeResult.responseTime,
        statusCode: scrapeResult.statusCode,
        htmlHash: scrapeResult.htmlHash,
        screenshotPath: scrapeResult.screenshotPath
      });

      // Update last checked time
      await urlsRepo.updateLastChecked(urlId);

      // Get previous HTML snapshot
      const previousSnapshot = await db
        .select()
        .from(htmlSnapshots)
        .where(eq(htmlSnapshots.htmlHash, scrapeResult.htmlHash))
        .limit(1);

      const previousHtml = previousSnapshot.length > 0 ? previousSnapshot[0].normalizedContent : null;

      // Store new HTML snapshot if it's new
      if (previousSnapshot.length === 0) {
        await db.insert(htmlSnapshots).values({
          checkId: check.id,
          htmlHash: scrapeResult.htmlHash,
          content: scrapeResult.html,
          normalizedContent: scrapeResult.normalizedHtml
        });
      }

      // Detect changes
      const changeResult = await changeDetector.detectChanges(
        previousHtml,
        scrapeResult.html,
        scrapeResult.normalizedHtml
      );

      if (changeResult.hasChanged && changeResult.type) {
        logger.warn('Change detected!', {
          type: changeResult.type,
          priority: changeResult.priority,
          confidence: changeResult.confidence
        });

        // Record change
        const change = await changesRepo.create({
          checkId: check.id,
          urlId,
          type: changeResult.type,
          priority: changeResult.priority,
          confidence: changeResult.confidence,
          description: changeResult.description,
          diff: changeResult.diff,
          matchedKeywords: changeResult.matchedKeywords
        });

        // Dispatch notifications
        await notificationDispatcher.dispatch({
          changeId: change.id,
          priority: changeResult.priority,
          title: `Change Detected: ${changeResult.type}`,
          message: changeResult.description,
          url,
          screenshotPath: scrapeResult.screenshotPath,
          metadata: {
            confidence: changeResult.confidence,
            matchedKeywords: changeResult.matchedKeywords
          }
        });

        logger.info('Notifications dispatched', { changeId: change.id });
      }

      logger.info('Check job completed', { urlId, url, hasChanged: changeResult.hasChanged });

      return {
        success: true,
        checkId: check.id,
        hasChanged: changeResult.hasChanged,
        changeType: changeResult.type,
        priority: changeResult.priority
      };
    } catch (error) {
      logger.error('Check job failed with error', { urlId, url, error });

      // Record error check
      await checksRepo.create({
        urlId,
        status: CheckStatus.ERROR,
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  },
  {
    connection: new IORedis({
      host: REDIS_CONFIG.HOST,
      port: REDIS_CONFIG.PORT,
      password: REDIS_CONFIG.PASSWORD,
      maxRetriesPerRequest: null
    }),
    concurrency: 1, // Process one check at a time
    limiter: {
      max: 1,
      duration: 1000 // 1 check per second
    }
  }
);

monitorWorker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

monitorWorker.on('failed', (job, error) => {
  logger.error('Job failed', { jobId: job?.id, error });
});

logger.info('Monitor worker initialized');

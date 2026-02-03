// Load env first
import '../env-loader';

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
  ScreenshotsRepository,
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
const screenshotsRepo = new ScreenshotsRepository();

interface CheckJobData {
  urlId: string;
  url: string;
}

export const monitorWorker = new Worker<CheckJobData>(
  'check-queue',
  async (job: Job<CheckJobData>) => {
    const { urlId, url } = job.data;

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

      // Record successful check (using normalizedHtmlHash for change detection)
      const check = await checksRepo.create({
        urlId,
        status: CheckStatus.SUCCESS,
        responseTime: scrapeResult.responseTime,
        statusCode: scrapeResult.statusCode,
        htmlHash: scrapeResult.normalizedHtmlHash,
        screenshotPath: scrapeResult.screenshotPath
      });

      // Update last checked time
      await urlsRepo.updateLastChecked(urlId);

      // Save screenshot to database if available
      if (scrapeResult.screenshotPath) {
        try {
          const fs = require('fs');
          const stats = fs.statSync(scrapeResult.screenshotPath);
          await screenshotsRepo.create({
            checkId: check.id,
            filePath: scrapeResult.screenshotPath,
            fileSize: stats.size,
            width: 1920, // Default viewport width from scraper
            height: 1080 // Approximate height
          });
        } catch (error) {
          logger.error('Failed to save screenshot to database', { error });
        }
      }

      // Get LAST check for this URL to find previous HTML
      const previousChecks = await checksRepo.findByUrlId(urlId, 2); // Get last 2 checks
      let previousHtmlNormalized: string | null = null;
      let previousHtmlOriginal: string | null = null;
      let previousHtmlHash: string | null = null;

      if (previousChecks.length > 1) {
        // We have at least one previous check (current one is already saved)
        // Actually, we just saved the current check, so previousChecks[0] is the current one
        // We need to look at the check BEFORE the current one
        // Let's get the last check that's NOT the current one
        const olderChecks = await checksRepo.findByUrlId(urlId, 10); // Get more to be safe
        const previousCheck = olderChecks.find(c => c.id !== check.id);

        if (previousCheck && previousCheck.htmlHash) {
          // Get the HTML snapshot for the previous check
          const previousSnapshot = await db
            .select()
            .from(htmlSnapshots)
            .where(eq(htmlSnapshots.htmlHash, previousCheck.htmlHash))
            .limit(1);

          if (previousSnapshot.length > 0) {
            previousHtmlNormalized = previousSnapshot[0].normalizedContent;
            previousHtmlOriginal = previousSnapshot[0].content;
            previousHtmlHash = previousCheck.htmlHash;
          }
        }
      }

      // Store new HTML snapshot if hash is different (using normalizedHtmlHash)
      const existingSnapshot = await db
        .select()
        .from(htmlSnapshots)
        .where(eq(htmlSnapshots.htmlHash, scrapeResult.normalizedHtmlHash))
        .limit(1);

      if (existingSnapshot.length === 0) {
        await db.insert(htmlSnapshots).values({
          checkId: check.id,
          htmlHash: scrapeResult.normalizedHtmlHash,
          content: scrapeResult.html,
          normalizedContent: scrapeResult.normalizedHtml
        });
      }

      // Detect changes (using normalizedHtmlHash for comparison)
      const changeResult = await changeDetector.detectChanges(
        previousHtmlNormalized,
        previousHtmlOriginal,
        scrapeResult.html,
        scrapeResult.normalizedHtml,
        previousHtmlHash,
        scrapeResult.normalizedHtmlHash
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
      }

      if (changeResult.hasChanged) {
        logger.info('Change detected', {
          url,
          type: changeResult.type,
          priority: changeResult.priority
        });
      }

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
    concurrency: 1 // Process jobs one at a time, sequentially
  }
);

monitorWorker.on('failed', (job, error) => {
  logger.error('Job failed', { jobId: job?.id, error });
});

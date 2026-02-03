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
      // Get the URL record to check lastHtmlHash
      const urlRecord = await urlsRepo.findById(urlId);
      if (!urlRecord) {
        throw new Error(`URL with id ${urlId} not found`);
      }

      // Scrape the page
      const scrapeResult = await pageScraper.scrape(url);

      if (!scrapeResult.success) {
        // Record failed check (always save failures)
        await checksRepo.create({
          urlId,
          status: CheckStatus.FAILED,
          responseTime: scrapeResult.responseTime,
          statusCode: scrapeResult.statusCode,
          error: scrapeResult.error
        });

        // Still update lastChecked even on failure
        await urlsRepo.updateLastChecked(urlId);

        logger.error('Check failed', { urlId, url, error: scrapeResult.error });
        return { success: false, error: scrapeResult.error };
      }

      // Get previous HTML for change detection (using lastHtmlHash from URL)
      let previousHtmlNormalized: string | null = null;
      let previousHtmlOriginal: string | null = null;
      const previousHtmlHash = urlRecord.lastHtmlHash || null;

      if (previousHtmlHash) {
        const previousSnapshot = await db
          .select()
          .from(htmlSnapshots)
          .where(eq(htmlSnapshots.htmlHash, previousHtmlHash))
          .limit(1);

        if (previousSnapshot.length > 0) {
          previousHtmlNormalized = previousSnapshot[0].normalizedContent;
          previousHtmlOriginal = previousSnapshot[0].content;
        }
      }

      // Store new HTML snapshot if hash is different
      const hasHashChanged = previousHtmlHash !== scrapeResult.normalizedHtmlHash;
      if (hasHashChanged) {
        const existingSnapshot = await db
          .select()
          .from(htmlSnapshots)
          .where(eq(htmlSnapshots.htmlHash, scrapeResult.normalizedHtmlHash))
          .limit(1);

        if (existingSnapshot.length === 0) {
          await db.insert(htmlSnapshots).values({
            checkId: null,
            htmlHash: scrapeResult.normalizedHtmlHash,
            content: scrapeResult.html,
            normalizedContent: scrapeResult.normalizedHtml
          });
        }
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

      // Always update lastChecked and lastHtmlHash on the URL
      await urlsRepo.updateLastChecked(urlId, scrapeResult.normalizedHtmlHash);

      // Only save check if there's an actual change
      if (changeResult.hasChanged && changeResult.type) {
        logger.warn('Change detected!', {
          type: changeResult.type,
          priority: changeResult.priority,
          confidence: changeResult.confidence
        });

        // Create check record only when there's a change
        const check = await checksRepo.create({
          urlId,
          status: CheckStatus.SUCCESS,
          responseTime: scrapeResult.responseTime,
          statusCode: scrapeResult.statusCode,
          htmlHash: scrapeResult.normalizedHtmlHash,
          screenshotPath: scrapeResult.screenshotPath
        });

        // Save screenshot to database
        if (scrapeResult.screenshotPath) {
          try {
            const fs = require('fs');
            const stats = fs.statSync(scrapeResult.screenshotPath);
            await screenshotsRepo.create({
              checkId: check.id,
              filePath: scrapeResult.screenshotPath,
              fileSize: stats.size,
              width: 1920,
              height: 1080
            });
          } catch (error) {
            logger.error('Failed to save screenshot to database', { error });
          }
        }

        // Update the HTML snapshot with the check ID
        await db
          .update(htmlSnapshots)
          .set({ checkId: check.id })
          .where(eq(htmlSnapshots.htmlHash, scrapeResult.normalizedHtmlHash));

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

        return {
          success: true,
          checkId: check.id,
          hasChanged: true,
          changeType: changeResult.type,
          priority: changeResult.priority
        };
      }

      // No change detected - don't save check
      logger.debug('No change detected', { url });

      return {
        success: true,
        hasChanged: false
      };
    } catch (error) {
      logger.error('Check job failed with error', { urlId, url, error });

      // Record error check (always save errors)
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

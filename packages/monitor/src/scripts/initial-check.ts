// MUST be first import to load .env before anything else
import '../env-loader';

import { createModuleLogger } from '@boat-monitor/shared';
import { MonitoredUrlsRepository, ChecksRepository, ChangesRepository, db } from '@boat-monitor/database';
import { playwrightManager } from '../scraper/playwright-manager';
import { PageScraper } from '../scraper/page-scraper';
import { CheckStatus, ChangeType, Priority } from '@boat-monitor/shared';
import crypto from 'crypto';
import fs from 'fs';
import { sql } from 'drizzle-orm';

const logger = createModuleLogger('initial-check');

async function runInitialChecks() {

  const urlsRepo = new MonitoredUrlsRepository();
  const checksRepo = new ChecksRepository();
  const changesRepo = new ChangesRepository();

  const scraper = new PageScraper();

  try {
    await playwrightManager.initialize();

    // Get all enabled URLs
    const urls = await urlsRepo.findEnabled();

    for (const url of urls) {
      try {

        const result = await scraper.scrape(url.url);

        if (result.success && result.html && result.screenshotPath) {
          // Create check record
          const check = await checksRepo.create({
            urlId: url.id,
            status: CheckStatus.SUCCESS,
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            htmlHash: result.htmlHash,
            screenshotPath: result.screenshotPath
          });


          // Save HTML snapshot directly with SQL
          await db.execute(sql`
            INSERT INTO html_snapshots (id, check_id, html_hash, content, normalized_content, created_at)
            VALUES (uuid_generate_v4(), ${check.id}, ${result.htmlHash}, ${result.html}, ${result.normalizedHtml}, NOW())
            ON CONFLICT (html_hash) DO NOTHING
          `);


          // Save screenshot metadata directly with SQL
          if (result.screenshotPath && fs.existsSync(result.screenshotPath)) {
            const stats = fs.statSync(result.screenshotPath);
            await db.execute(sql`
              INSERT INTO screenshots (id, check_id, file_path, file_size, width, height, created_at)
              VALUES (uuid_generate_v4(), ${check.id}, ${result.screenshotPath}, ${stats.size}, 1920, 1080, NOW())
            `);

          }

          // Create initial state change
          await changesRepo.create({
            checkId: check.id,
            urlId: url.id,
            type: ChangeType.CONTENT,
            priority: Priority.INFO,
            confidence: 1.0,
            description: `Initialer Stand der Seite "${url.name}" erfasst`
          });


          // Update last checked time
          await urlsRepo.updateLastChecked(url.id);

        } else {
          // Create failed check
          await checksRepo.create({
            urlId: url.id,
            status: CheckStatus.FAILED,
            responseTime: result.responseTime,
            error: result.error || 'Unknown error'
          });

          logger.error(`Check failed for ${url.name}: ${result.error}`);
        }

      } catch (error) {
        logger.error(`Error checking URL ${url.name}:`, error);
        // Create failed check for exceptions
        await checksRepo.create({
          urlId: url.id,
          status: CheckStatus.FAILED,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }


  } catch (error) {
    logger.error('Initial checks failed:', error);
    throw error;
  } finally {
    await playwrightManager.close();
  }
}

function normalizeHtml(html: string): string {
  // Remove dynamic content that changes on every load
  let normalized = html
    // Remove timestamps and dates
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
    .replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, 'DATE')
    // Remove session IDs and tokens
    .replace(/[a-f0-9]{32,}/gi, 'TOKEN')
    // Remove cookie consent banners common patterns
    .replace(/<div[^>]*cookie[^>]*>.*?<\/div>/gis, '')
    .replace(/<div[^>]*consent[^>]*>.*?<\/div>/gis, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

// Run if called directly
if (require.main === module) {
  runInitialChecks()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Failed:', error);
      process.exit(1);
    });
}

export { runInitialChecks };

import { Page } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { playwrightManager } from './playwright-manager';
import { retry, createModuleLogger, APP_CONFIG, hashContent } from '@boat-monitor/shared';

const logger = createModuleLogger('PageScraper');

export interface ScrapeResult {
  html: string;
  htmlHash: string;
  normalizedHtml: string;
  normalizedHtmlHash: string;
  screenshotPath: string;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
}

export class PageScraper {
  async scrape(url: string): Promise<ScrapeResult> {
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      const result = await retry(
        async () => {
          page = await playwrightManager.newPage();
          return await this.performScrape(page, url);
        },
        {
          maxAttempts: APP_CONFIG.MAX_RETRY_ATTEMPTS,
          delayMs: APP_CONFIG.RETRY_DELAY_MS,
          onRetry: (error, attempt) => {
            logger.warn(`Scrape attempt ${attempt} failed`, { url, error: error.message });
          }
        }
      );

      const responseTime = Date.now() - startTime;

      return {
        ...result,
        responseTime,
        success: true
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Page scrape failed', { url, error, responseTime });

      return {
        html: '',
        htmlHash: '',
        normalizedHtml: '',
        normalizedHtmlHash: '',
        screenshotPath: '',
        responseTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      if (page !== null) {
        await (page as Page).close().catch((err: unknown) => {
          logger.warn('Failed to close page', { error: err });
        });
      }
    }
  }

  private async performScrape(page: Page, url: string): Promise<Omit<ScrapeResult, 'responseTime' | 'success'>> {
    // Navigate to page
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: APP_CONFIG.PAGE_TIMEOUT_MS
    });

    if (!response) {
      throw new Error('No response received');
    }

    const statusCode = response.status();

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Additional wait for dynamic content

    // Extract HTML content
    const html = await page.content();
    const htmlHash = hashContent(html);

    // Normalize HTML for comparison
    const normalizedHtml = await this.normalizeHtml(page);
    const normalizedHtmlHash = hashContent(normalizedHtml);

    // Take screenshot
    const screenshotPath = await this.takeScreenshot(page, url);

    return {
      html,
      htmlHash,
      normalizedHtml,
      normalizedHtmlHash,
      screenshotPath,
      statusCode
    };
  }

  private async normalizeHtml(page: Page): Promise<string> {
    // Get raw HTML and normalize via string processing
    // This is more reliable than browser-based DOM manipulation
    const html = await page.content();
    return this.normalizeHtmlString(html);
  }

  private normalizeHtmlString(html: string): string {
    let normalized = html;

    // 1. Extract ONLY the <body> content (ignores <head>, <script>, <style>, <link> in head)
    // This is the most robust approach - instead of removing things, we only keep what we care about
    const bodyMatch = normalized.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      normalized = bodyMatch[1];
    }

    // 2. Remove externerLink class (dynamically added by CCM19)
    // Handle various positions: as sole class, at start, middle, or end of class list
    normalized = normalized.replace(/\s*class=["']externerLink["']/gi, '');
    normalized = normalized.replace(/(\s)externerLink(\s)/gi, '$1$2');
    normalized = normalized.replace(/(\s)externerLink(["'])/gi, '$1$2');
    normalized = normalized.replace(/(["'])externerLink(\s)/gi, '$1$2');

    // 3. Remove inline scripts in body (if any remain)
    normalized = normalized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // 4. Remove style tags in body (if any)
    normalized = normalized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // 5. Remove noscript tags
    normalized = normalized.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // 6. Remove timestamps
    normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/g, 'TIMESTAMP');
    normalized = normalized.replace(/\d{2}\.\d{2}\.\d{4}/g, 'DATE');
    normalized = normalized.replace(/\d{1,2}:\d{2}(:\d{2})?/g, 'TIME');

    // 7. Remove session IDs and tokens
    normalized = normalized.replace(/sessionid=[a-zA-Z0-9_-]+/gi, 'sessionid=SESSION');
    normalized = normalized.replace(/csrf[_-]?token=[a-zA-Z0-9_-]+/gi, 'csrf_token=TOKEN');
    normalized = normalized.replace(/token=[a-zA-Z0-9_-]+/gi, 'token=TOKEN');

    // 8. Remove UUIDs
    normalized = normalized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID');

    // 9. Normalize CCM19 version parameters in URLs (timestamp-based)
    normalized = normalized.replace(/[?&]v=\d+/g, '');

    // 10. Aggressive whitespace normalization
    normalized = normalized.replace(/>\s+</g, '><');
    normalized = normalized.replace(/\s+/g, ' ');
    normalized = normalized.trim();

    return normalized;
  }

  private async takeScreenshot(page: Page, url: string): Promise<string> {
    try {
      // Create screenshot directory if it doesn't exist
      const screenshotDir = APP_CONFIG.SCREENSHOT_DIR;
      await fs.mkdir(screenshotDir, { recursive: true });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const urlHash = hashContent(url).substring(0, 8);
      const filename = `screenshot-${urlHash}-${timestamp}.png`;
      const filePath = path.join(screenshotDir, filename);

      // Take full-page screenshot
      await page.screenshot({
        path: filePath,
        fullPage: true,
        type: 'png'
      });

      // Return absolute path so it can be accessed from other packages
      const absolutePath = path.resolve(filePath);
      return absolutePath;
    } catch (error) {
      logger.error('Failed to take screenshot', { error });
      throw error;
    }
  }
}

export const pageScraper = new PageScraper();

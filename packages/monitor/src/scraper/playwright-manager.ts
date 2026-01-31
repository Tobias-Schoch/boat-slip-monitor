import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { createModuleLogger } from '@boat-monitor/shared';

const logger = createModuleLogger('PlaywrightManager');

export class PlaywrightManager {
  private browser: Browser | null = null;
  private contexts: BrowserContext[] = [];
  private readonly poolSize: number = 4;

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Playwright browser...');

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      // Create persistent browser contexts
      for (let i = 0; i < this.poolSize; i++) {
        const context = await this.createContext();
        this.contexts.push(context);
      }

      logger.info(`Playwright initialized with ${this.poolSize} contexts`);
    } catch (error) {
      logger.error('Failed to initialize Playwright', { error });
      throw error;
    }
  }

  private async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      geolocation: { latitude: 47.6596, longitude: 9.1753 }, // Konstanz coordinates
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      }
    });

    // Apply stealth scripts to avoid bot detection
    // Note: This function runs in browser context where window and navigator are available
    await context.addInitScript(() => {
      // Override webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['de-DE', 'de', 'en']
      });

      // Chrome property
      // @ts-expect-error - window is available in browser context
      (window as any).chrome = {
        runtime: {}
      };

      // Permissions
      // @ts-expect-error - window is available in browser context
      const originalQuery = window.navigator.permissions.query;
      // @ts-expect-error - window is available in browser context
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === 'notifications'
          ? Promise.resolve({ state: 'denied' } as any)
          : originalQuery(parameters);
    });

    return context;
  }

  async getContext(): Promise<BrowserContext> {
    if (this.contexts.length === 0) {
      const context = await this.createContext();
      this.contexts.push(context);
      return context;
    }

    // Simple round-robin
    const context = this.contexts.shift()!;
    this.contexts.push(context);
    return context;
  }

  async newPage(): Promise<Page> {
    const context = await this.getContext();
    return await context.newPage();
  }

  async close(): Promise<void> {
    try {
      logger.info('Closing Playwright browser...');

      for (const context of this.contexts) {
        await context.close();
      }
      this.contexts = [];

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      logger.info('Playwright browser closed');
    } catch (error) {
      logger.error('Error closing Playwright', { error });
    }
  }
}

// Singleton instance
export const playwrightManager = new PlaywrightManager();

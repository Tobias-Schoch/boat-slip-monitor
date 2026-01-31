import { SettingsRepository } from '@boat-monitor/database';
import { createModuleLogger } from '@boat-monitor/shared';

const logger = createModuleLogger('SettingsService');

export class SettingsService {
  private settingsRepo: SettingsRepository;
  private cache: Map<string, string> = new Map();
  private lastFetch: number = 0;
  private cacheDuration: number = 60000; // 1 minute cache

  constructor() {
    this.settingsRepo = new SettingsRepository();
  }

  /**
   * Get a setting value from database with caching
   */
  async get(key: string, defaultValue?: string): Promise<string | null> {
    await this.refreshCacheIfNeeded();
    return this.cache.get(key) || defaultValue || null;
  }

  /**
   * Get a setting as number
   */
  async getNumber(key: string, defaultValue?: number): Promise<number | null> {
    const value = await this.get(key);
    if (value === null) return defaultValue || null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? (defaultValue || null) : parsed;
  }

  /**
   * Get a setting as boolean
   */
  async getBoolean(key: string, defaultValue?: boolean): Promise<boolean> {
    const value = await this.get(key);
    if (value === null) return defaultValue || false;
    return value === 'true' || value === '1';
  }

  /**
   * Get all settings as object
   */
  async getAll(): Promise<Record<string, string>> {
    await this.refreshCacheIfNeeded();
    return Object.fromEntries(this.cache);
  }

  /**
   * Update a setting value
   */
  async set(key: string, value: string): Promise<void> {
    await this.settingsRepo.updateValue(key, value);
    this.cache.set(key, value);
    logger.info(`Setting updated: ${key}`);
  }

  /**
   * Refresh cache if expired
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastFetch > this.cacheDuration) {
      await this.refreshCache();
    }
  }

  /**
   * Force refresh cache from database
   */
  async refreshCache(): Promise<void> {
    try {
      const settings = await this.settingsRepo.findAll();
      this.cache.clear();

      for (const setting of settings) {
        if (setting.value) {
          this.cache.set(setting.key, setting.value);
        }
      }

      this.lastFetch = Date.now();
      logger.debug(`Settings cache refreshed: ${this.cache.size} settings loaded`);
    } catch (error) {
      logger.error('Failed to refresh settings cache:', error);
      throw error;
    }
  }

  /**
   * Check if a notification channel is enabled
   */
  async isChannelEnabled(channel: 'telegram' | 'email'): Promise<boolean> {
    if (channel === 'telegram') {
      const token = await this.get('telegram_bot_token');
      const chatId = await this.get('telegram_chat_id');
      return !!(token && chatId);
    } else if (channel === 'email') {
      const host = await this.get('smtp_host');
      const user = await this.get('smtp_user');
      return !!(host && user);
    }
    return false;
  }

  /**
   * Get Telegram configuration
   */
  async getTelegramConfig(): Promise<{ token: string; chatId: string } | null> {
    const token = await this.get('telegram_bot_token');
    const chatId = await this.get('telegram_chat_id');

    if (!token || !chatId) {
      logger.warn('Telegram configuration incomplete');
      return null;
    }

    return { token, chatId };
  }

  /**
   * Get SMTP configuration
   */
  async getSmtpConfig(): Promise<{
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    to: string;
  } | null> {
    const host = await this.get('smtp_host');
    const port = await this.getNumber('smtp_port', 587);
    const secure = await this.getBoolean('smtp_secure', false);
    const user = await this.get('smtp_user');
    const password = await this.get('smtp_password');
    const from = await this.get('smtp_from');
    const to = await this.get('smtp_to');

    if (!host || !user || !from || !to) {
      logger.warn('SMTP configuration incomplete');
      return null;
    }

    return {
      host,
      port: port!,
      secure,
      user,
      password: password || '',
      from,
      to
    };
  }

  /**
   * Get monitoring configuration
   */
  async getMonitoringConfig(): Promise<{
    checkInterval: number;
    logLevel: string;
    screenshotDir: string;
  }> {
    return {
      checkInterval: await this.getNumber('check_interval_minutes', 5) || 5,
      logLevel: await this.get('log_level', 'info') || 'info',
      screenshotDir: await this.get('screenshot_dir', './data/screenshots') || './data/screenshots'
    };
  }
}

// Singleton instance
export const settingsService = new SettingsService();

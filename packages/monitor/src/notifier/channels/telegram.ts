// Load env first
import '../../env-loader';

import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs/promises';
import { NotificationPayload, NotificationResult, createModuleLogger } from '@boat-monitor/shared';
import { settingsService } from '../../services/settings-service';

const logger = createModuleLogger('TelegramChannel');

class TelegramChannel {
  private bot: TelegramBot | null = null;
  private chatId: string = '';
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = await settingsService.getTelegramConfig();

    if (config) {
      this.bot = new TelegramBot(config.token, { polling: false });
      this.chatId = config.chatId;
      this.initialized = true;
      logger.info('Telegram bot initialized from database');
    } else {
      logger.warn('Telegram bot not configured in database');
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    await this.initialize();

    if (!this.bot || !this.chatId) {
      return {
        success: false,
        channel: 'TELEGRAM' as any,
        error: 'Telegram not configured'
      };
    }

    try {
      const message = this.formatMessage(payload);

      // Build inline keyboard buttons
      const buttons: any[] = [];

      // Only add URL button if we have a valid URL (not localhost)
      if (payload.url && !payload.url.includes('localhost')) {
        buttons.push({ text: '🔍 View Page', url: payload.url });
      }

      buttons.push({ text: '✅ Acknowledge', callback_data: 'ack' });

      // Send text message
      const sentMessage = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [buttons]
        }
      });

      // Send screenshot if available
      if (payload.screenshotPath) {
        try {
          const screenshot = await fs.readFile(payload.screenshotPath);
          await this.bot.sendPhoto(this.chatId, screenshot, {
            caption: 'Screenshot of the detected change'
          });
        } catch (error) {
          logger.warn('Failed to send screenshot', { error });
        }
      }

      logger.info('Telegram notification sent', {
        messageId: sentMessage.message_id
      });

      return {
        success: true,
        channel: 'TELEGRAM' as any,
        messageId: String(sentMessage.message_id)
      };
    } catch (error) {
      logger.error('Failed to send Telegram notification', { error });
      return {
        success: false,
        channel: 'TELEGRAM' as any,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private escapeMarkdown(text: string): string {
    // Escape Markdown special characters for Telegram
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
  }

  private formatMessage(payload: NotificationPayload): string {
    const priorityEmoji = {
      INFO: 'ℹ️',
      IMPORTANT: '⚠️',
      CRITICAL: '🚨'
    };

    const emoji = priorityEmoji[payload.priority] || 'ℹ️';

    let message = `${emoji} *${this.escapeMarkdown(payload.title)}*\n\n`;
    message += `${this.escapeMarkdown(payload.message)}\n\n`;

    // Show matched keywords if available (user wants to know what changed)
    if (payload.metadata?.matchedKeywords && payload.metadata.matchedKeywords.length > 0) {
      const keywords = payload.metadata.matchedKeywords.map((k: string) => this.escapeMarkdown(k)).join(', ');
      message += `🔍 Gefunden: ${keywords}\n\n`;
    }

    if (payload.url) {
      message += `🔗 ${this.escapeMarkdown(payload.url)}\n`;
    }

    message += `⏰ ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`;

    return message;
  }
}

export const telegramChannel = new TelegramChannel();

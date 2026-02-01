// Load env first
import '../../env-loader';

import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs/promises';
import { NotificationPayload, NotificationResult, createModuleLogger, Priority } from '@website-monitor/shared';
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
        buttons.push({ text: '🌐 Open Website', url: payload.url });
      }

      buttons.push({ text: '✅ Acknowledge', callback_data: 'ack' });

      // Send text message with MarkdownV2
      const sentMessage = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [buttons]
        },
        disable_web_page_preview: false
      });

      // Send screenshot if available
      if (payload.screenshotPath) {
        try {
          const screenshot = await fs.readFile(payload.screenshotPath);
          await this.bot.sendPhoto(this.chatId, screenshot, {
            caption: '📸 Screenshot of detected change',
            reply_to_message_id: sentMessage.message_id
          });
        } catch (error) {
          logger.warn('Failed to send screenshot', { error });
        }
      }

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

  private escapeMarkdownV2(text: string): string {
    // Escape MarkdownV2 special characters for Telegram
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
  }

  private formatMessage(payload: NotificationPayload): string {
    const priorityConfig = {
      INFO: { emoji: '🔵', label: 'INFO', color: '' },
      IMPORTANT: { emoji: '🟡', label: 'IMPORTANT', color: '' },
      CRITICAL: { emoji: '🔴', label: 'CRITICAL', color: '' }
    };

    const config = priorityConfig[payload.priority] || priorityConfig.INFO;

    // Header with priority badge
    let message = `${config.emoji} *${this.escapeMarkdownV2(config.label)}* ${config.emoji}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Title
    message += `📋 *${this.escapeMarkdownV2(payload.title)}*\n\n`;

    // Message body
    message += `${this.escapeMarkdownV2(payload.message)}\n\n`;

    // Matched keywords section
    if (payload.metadata?.matchedKeywords && payload.metadata.matchedKeywords.length > 0) {
      message += `🔍 *Matched Keywords:*\n`;
      const keywords = payload.metadata.matchedKeywords
        .map((k: string) => `  \\• \`${this.escapeMarkdownV2(k)}\``)
        .join('\n');
      message += `${keywords}\n\n`;
    }

    // Confidence level
    if (payload.metadata?.confidence !== undefined) {
      const confidence = Math.round(payload.metadata.confidence * 100);
      const confidenceBar = this.getConfidenceBar(confidence);
      message += `📊 *Confidence:* ${confidence}% ${confidenceBar}\n\n`;
    }

    // URL
    if (payload.url) {
      const escapedUrl = this.escapeMarkdownV2(payload.url);
      message += `🔗 *URL:*\n${escapedUrl}\n\n`;
    }

    // Footer with timestamp
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false
    });
    message += `⏰ ${this.escapeMarkdownV2(timestamp)}`;

    return message;
  }

  private getConfidenceBar(percentage: number): string {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}

export const telegramChannel = new TelegramChannel();

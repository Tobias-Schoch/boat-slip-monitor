import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs/promises';
import { NotificationPayload, NotificationResult, createModuleLogger } from '@boat-monitor/shared';

const logger = createModuleLogger('TelegramChannel');

class TelegramChannel {
  private bot: TelegramBot | null = null;
  private chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';

    if (token && this.chatId) {
      this.bot = new TelegramBot(token, { polling: false });
      logger.info('Telegram bot initialized');
    } else {
      logger.warn('Telegram bot not configured');
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.bot || !this.chatId) {
      return {
        success: false,
        channel: 'TELEGRAM' as any,
        error: 'Telegram not configured'
      };
    }

    try {
      const message = this.formatMessage(payload);

      // Send text message
      const sentMessage = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔍 View Dashboard', url: payload.url || 'http://localhost:3000' },
              { text: '✅ Acknowledge', callback_data: 'ack' }
            ]
          ]
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

      logger.info('Telegram notification sent', { messageId: sentMessage.message_id });

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

  private formatMessage(payload: NotificationPayload): string {
    const priorityEmoji = {
      INFO: 'ℹ️',
      IMPORTANT: '⚠️',
      CRITICAL: '🚨'
    };

    const emoji = priorityEmoji[payload.priority] || 'ℹ️';

    let message = `${emoji} *${payload.title}*\n\n`;
    message += `${payload.message}\n\n`;

    if (payload.url) {
      message += `🔗 URL: ${payload.url}\n`;
    }

    if (payload.metadata?.confidence) {
      const confidence = Math.round(payload.metadata.confidence * 100);
      message += `📊 Confidence: ${confidence}%\n`;
    }

    if (payload.metadata?.matchedKeywords && payload.metadata.matchedKeywords.length > 0) {
      message += `🔑 Keywords: ${payload.metadata.matchedKeywords.join(', ')}\n`;
    }

    message += `\n⏰ ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`;

    return message;
  }
}

export const telegramChannel = new TelegramChannel();

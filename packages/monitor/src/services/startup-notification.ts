import { createModuleLogger, Priority } from '@website-monitor/shared';
import { settingsService } from './settings-service';
import { telegramChannel } from '../notifier/channels/telegram';
import { emailChannel } from '../notifier/channels/email';

const logger = createModuleLogger('StartupNotification');

export async function sendStartupNotification(): Promise<void> {

  try {
    // Check if channels are configured (have credentials)
    const telegramToken = await settingsService.get('telegram_bot_token');
    const telegramChatId = await settingsService.get('telegram_chat_id');
    const smtpUser = await settingsService.get('smtp_user');
    const smtpFrom = await settingsService.get('smtp_from');

    const telegramEnabled = !!(telegramToken && telegramChatId);
    const emailEnabled = !!(smtpUser && smtpFrom);

    const startupPayload = {
      title: '✅ Monitor Started',
      message: `Website Change Monitor has been successfully started and is now running.\n\nStart time: ${new Date().toISOString()}\n\nThe monitor is now automatically checking all configured URLs for changes.`,
      priority: Priority.INFO,
      url: undefined,
      metadata: {}
    };

    // Send to Telegram if enabled
    if (telegramEnabled) {
      try {
        const result = await telegramChannel.send(startupPayload);
        if (result.success) {
        } else {
          logger.error('Failed to send Telegram startup notification', { error: result.error });
        }
      } catch (error) {
        logger.error('Error sending Telegram startup notification', { error });
      }
    }

    // Send to Email if enabled
    if (emailEnabled) {
      try {
        const result = await emailChannel.send(startupPayload);
        if (result.success) {
        } else {
          logger.error('Failed to send Email startup notification', { error: result.error });
        }
      } catch (error) {
        logger.error('Error sending Email startup notification', { error });
      }
    }

    if (!telegramEnabled && !emailEnabled) {
      logger.warn('No notification channels enabled - skipping startup notification');
    }

  } catch (error) {
    logger.error('Failed to send startup notifications', { error });
  }
}

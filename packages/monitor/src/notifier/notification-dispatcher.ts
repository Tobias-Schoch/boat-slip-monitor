import {
  Priority,
  NotificationPayload,
  createModuleLogger
} from '@website-monitor/shared';
import { settingsService } from '../services/settings-service';
import { telegramChannel } from './channels/telegram';
import { emailChannel } from './channels/email';

const logger = createModuleLogger('NotificationDispatcher');

interface DispatchPayload extends NotificationPayload {
  changeId: string;
}

class NotificationDispatcher {
  async dispatch(payload: DispatchPayload): Promise<void> {
    // Check if channels are configured (have credentials)
    const telegramToken = await settingsService.get('telegram_bot_token');
    const telegramChatId = await settingsService.get('telegram_chat_id');
    const smtpUser = await settingsService.get('smtp_user');
    const smtpFrom = await settingsService.get('smtp_from');

    const telegramEnabled = !!(telegramToken && telegramChatId);
    const emailEnabled = !!(smtpUser && smtpFrom);

    const results: Promise<any>[] = [];

    // Send to Telegram if configured
    if (telegramEnabled) {
      results.push(
        telegramChannel.send(payload).catch(error => {
          logger.error('Telegram notification failed', { error });
          return { success: false, error };
        })
      );
    }

    // Send to Email if configured
    if (emailEnabled) {
      results.push(
        emailChannel.send(payload).catch(error => {
          logger.error('Email notification failed', { error });
          return { success: false, error };
        })
      );
    }

    if (results.length === 0) {
      logger.warn('No notification channels configured - add credentials in settings');
      return;
    }

    // Wait for all notifications to complete
    await Promise.allSettled(results);
  }
}

export const notificationDispatcher = new NotificationDispatcher();

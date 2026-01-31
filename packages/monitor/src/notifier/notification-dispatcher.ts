import {
  Priority,
  NotificationChannel,
  NotificationStatus,
  NotificationPayload,
  createModuleLogger,
  NOTIFICATION_CONFIG
} from '@boat-monitor/shared';
import { NotificationsRepository } from '@boat-monitor/database';
import { telegramChannel } from './channels/telegram';
import { emailChannel } from './channels/email';
import { smsChannel } from './channels/sms';
import { voiceChannel } from './channels/voice';

const logger = createModuleLogger('NotificationDispatcher');
const notificationsRepo = new NotificationsRepository();

interface DispatchPayload extends NotificationPayload {
  changeId: string;
}

class NotificationDispatcher {
  private rateLimitMap = new Map<string, number[]>();

  async dispatch(payload: DispatchPayload): Promise<void> {
    logger.info('Dispatching notifications', {
      changeId: payload.changeId,
      priority: payload.priority
    });

    // Get enabled channels for this priority
    const channels = this.getChannelsForPriority(payload.priority);

    // Dispatch to all channels in parallel
    const results = await Promise.allSettled(
      channels.map(channel => this.sendToChannel(channel, payload))
    );

    // Log results
    results.forEach((result, index) => {
      const channel = channels[index];
      if (result.status === 'fulfilled') {
        logger.info('Notification sent successfully', { channel });
      } else {
        logger.error('Notification failed', { channel, error: result.reason });
      }
    });
  }

  private getChannelsForPriority(priority: Priority): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    for (const config of NOTIFICATION_CONFIG.CHANNELS) {
      if (config.enabled && config.priority.includes(priority)) {
        channels.push(config.channel);
      }
    }

    return channels;
  }

  private async sendToChannel(
    channel: NotificationChannel,
    payload: DispatchPayload
  ): Promise<void> {
    // Check rate limit
    if (!this.checkRateLimit(channel, payload.priority)) {
      logger.warn('Rate limit exceeded', { channel, priority: payload.priority });
      return;
    }

    // Check deduplication
    if (await this.isDuplicate(payload.changeId, channel)) {
      logger.info('Skipping duplicate notification', { channel, changeId: payload.changeId });
      return;
    }

    // Create notification record
    const notification = await notificationsRepo.create({
      changeId: payload.changeId,
      channel,
      priority: payload.priority,
      status: NotificationStatus.PENDING
    });

    try {
      // Send via appropriate channel
      let result;
      switch (channel) {
        case NotificationChannel.TELEGRAM:
          result = await telegramChannel.send(payload);
          break;
        case NotificationChannel.EMAIL:
          result = await emailChannel.send(payload);
          break;
        case NotificationChannel.SMS:
          result = await smsChannel.send(payload);
          break;
        case NotificationChannel.VOICE:
          result = await voiceChannel.send(payload);
          break;
        default:
          throw new Error(`Unknown channel: ${channel}`);
      }

      if (result.success) {
        await notificationsRepo.updateStatus(
          notification.id,
          NotificationStatus.SENT,
          undefined,
          result.messageId
        );
        logger.info('Notification sent', { channel, notificationId: notification.id });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await notificationsRepo.updateStatus(
        notification.id,
        NotificationStatus.FAILED,
        errorMessage
      );
      logger.error('Failed to send notification', { channel, error: errorMessage });
      throw error;
    }
  }

  private checkRateLimit(channel: NotificationChannel, priority: Priority): boolean {
    const config = NOTIFICATION_CONFIG.CHANNELS.find(c => c.channel === channel);
    if (!config?.rateLimit) return true;

    const key = `${channel}-${priority}`;
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(
      ts => now - ts < config.rateLimit!.windowMs
    );

    if (validTimestamps.length >= config.rateLimit.maxNotifications) {
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.rateLimitMap.set(key, validTimestamps);

    return true;
  }

  private async isDuplicate(changeId: string, channel: NotificationChannel): Promise<boolean> {
    const recentNotifications = await notificationsRepo.findByChangeId(changeId);
    const duplicates = recentNotifications.filter(
      n => n.channel === channel &&
           n.status === NotificationStatus.SENT &&
           Date.now() - n.createdAt.getTime() < NOTIFICATION_CONFIG.DEDUPLICATION_WINDOW_MS
    );
    return duplicates.length > 0;
  }
}

export const notificationDispatcher = new NotificationDispatcher();

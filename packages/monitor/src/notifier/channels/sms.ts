import twilio from 'twilio';
import { NotificationPayload, NotificationResult, createModuleLogger } from '@boat-monitor/shared';

const logger = createModuleLogger('SmsChannel');

class SmsChannel {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private toNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.toNumber = process.env.TWILIO_TO_PHONE_NUMBER || '';

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken && this.fromNumber && this.toNumber) {
      this.client = twilio(accountSid, authToken);
      logger.info('Twilio SMS client initialized');
    } else {
      logger.warn('Twilio SMS not configured');
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.client || !this.fromNumber || !this.toNumber) {
      return {
        success: false,
        channel: 'SMS' as any,
        error: 'Twilio SMS not configured'
      };
    }

    try {
      const message = this.formatMessage(payload);

      const sentMessage = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: this.toNumber
      });

      logger.info('SMS notification sent', { messageId: sentMessage.sid });

      return {
        success: true,
        channel: 'SMS' as any,
        messageId: sentMessage.sid
      };
    } catch (error) {
      logger.error('Failed to send SMS notification', { error });
      return {
        success: false,
        channel: 'SMS' as any,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private formatMessage(payload: NotificationPayload): string {
    // SMS has 160 character limit, keep it short
    let message = `[${payload.priority}] ${payload.title}\n`;
    message += payload.message.substring(0, 100); // Truncate if too long

    if (payload.url) {
      message += `\n${payload.url}`;
    }

    // Ensure it fits in 160 characters
    if (message.length > 160) {
      message = message.substring(0, 157) + '...';
    }

    return message;
  }
}

export const smsChannel = new SmsChannel();

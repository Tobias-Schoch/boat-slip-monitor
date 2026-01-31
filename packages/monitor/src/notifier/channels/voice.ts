import twilio from 'twilio';
import { NotificationPayload, NotificationResult, createModuleLogger } from '@boat-monitor/shared';

const logger = createModuleLogger('VoiceChannel');

class VoiceChannel {
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
      logger.info('Twilio Voice client initialized');
    } else {
      logger.warn('Twilio Voice not configured');
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.client || !this.fromNumber || !this.toNumber) {
      return {
        success: false,
        channel: 'VOICE' as any,
        error: 'Twilio Voice not configured'
      };
    }

    // Check if voice calls are enabled
    if (process.env.ENABLE_VOICE_CALLS !== 'true') {
      logger.info('Voice calls disabled');
      return {
        success: false,
        channel: 'VOICE' as any,
        error: 'Voice calls disabled'
      };
    }

    try {
      const twiml = this.generateTwiml(payload);

      const call = await this.client.calls.create({
        twiml,
        from: this.fromNumber,
        to: this.toNumber
      });

      logger.info('Voice call initiated', { callSid: call.sid });

      return {
        success: true,
        channel: 'VOICE' as any,
        messageId: call.sid
      };
    } catch (error) {
      logger.error('Failed to initiate voice call', { error });
      return {
        success: false,
        channel: 'VOICE' as any,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private generateTwiml(payload: NotificationPayload): string {
    const message = this.formatVoiceMessage(payload);

    return `
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">
    ${message}
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Marlene" language="de-DE">
    Drücken Sie die 1-Taste zur Bestätigung.
  </Say>
  <Gather numDigits="1" timeout="10">
    <Say voice="Polly.Marlene" language="de-DE">
      Warten auf Eingabe.
    </Say>
  </Gather>
  <Say voice="Polly.Marlene" language="de-DE">
    Keine Eingabe erhalten. Auf Wiedersehen.
  </Say>
</Response>
    `.trim();
  }

  private formatVoiceMessage(payload: NotificationPayload): string {
    let message = `Wichtige Mitteilung. ${payload.priority}. `;
    message += payload.title.replace(/[^\w\s]/g, ''); // Remove special characters
    message += '. ';
    message += payload.message.substring(0, 200).replace(/[^\w\s]/g, '');

    return message;
  }
}

export const voiceChannel = new VoiceChannel();

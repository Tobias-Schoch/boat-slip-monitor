// Load env first
import '../../env-loader';

import nodemailer from 'nodemailer';
import { NotificationPayload, NotificationResult, createModuleLogger } from '@boat-monitor/shared';
import fs from 'fs/promises';
import { settingsService } from '../../services/settings-service';

const logger = createModuleLogger('EmailChannel');

class EmailChannel {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string = '';
  private toEmail: string = '';
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const config = await settingsService.getSmtpConfig();

    if (config) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password
        }
      });
      this.fromEmail = config.from;
      this.toEmail = config.to;
      this.initialized = true;
    } else{
      logger.warn('Email not configured in database');
    }
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    await this.initialize();

    if (!this.transporter || !this.fromEmail || !this.toEmail) {
      return {
        success: false,
        channel: 'EMAIL' as any,
        error: 'Email not configured'
      };
    }

    try {
      const html = this.formatHtml(payload);
      const attachments: any[] = [];

      // Add screenshot attachment if available
      if (payload.screenshotPath) {
        try {
          const screenshot = await fs.readFile(payload.screenshotPath);
          attachments.push({
            filename: 'screenshot.png',
            content: screenshot,
            contentType: 'image/png'
          });
        } catch (error) {
          logger.warn('Failed to attach screenshot', { error });
        }
      }

      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: this.toEmail,
        subject: `[${payload.priority}] ${payload.title}`,
        html,
        attachments
      });

      return {
        success: true,
        channel: 'EMAIL' as any,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('Failed to send email notification', { error });
      return {
        success: false,
        channel: 'EMAIL' as any,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private formatHtml(payload: NotificationPayload): string {
    const priorityColor = {
      INFO: '#3b82f6',
      IMPORTANT: '#f59e0b',
      CRITICAL: '#ef4444'
    };

    const color = priorityColor[payload.priority] || '#3b82f6';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: ${color};
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: ${color};
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .keywords {
      background: #fef3c7;
      padding: 12px;
      border-radius: 6px;
      margin: 15px 0;
      border-left: 4px solid #f59e0b;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0;">${payload.title}</h1>
  </div>
  <div class="content">
    <p style="font-size: 16px;">${payload.message}</p>

    ${payload.metadata?.matchedKeywords && payload.metadata.matchedKeywords.length > 0 ? `
    <div class="keywords">
      <strong>🔍 Gefundene Begriffe:</strong><br>
      ${payload.metadata.matchedKeywords.join(', ')}
    </div>
    ` : ''}

    ${payload.url ? `
    <a href="${payload.url}" class="button">Seite öffnen</a>
    ` : ''}

    <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
      ⏰ ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}
    </p>
  </div>
  <div class="footer">
    <p>Bootsliegeplatz Monitor</p>
  </div>
</body>
</html>
    `;
  }
}

export const emailChannel = new EmailChannel();

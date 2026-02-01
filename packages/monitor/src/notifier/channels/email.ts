// Load env first
import '../../env-loader';

import nodemailer from 'nodemailer';
import { NotificationPayload, NotificationResult, createModuleLogger } from '@website-monitor/shared';
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
    } else {
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
            contentType: 'image/png',
            cid: 'screenshot@monitor'
          });
        } catch (error) {
          logger.warn('Failed to attach screenshot', { error });
        }
      }

      const info = await this.transporter.sendMail({
        from: `"Website Monitor" <${this.fromEmail}>`,
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
    const priorityConfig = {
      INFO: { color: '#3b82f6', label: 'INFO', emoji: '🔵', bg: '#eff6ff' },
      IMPORTANT: { color: '#f59e0b', label: 'IMPORTANT', emoji: '🟡', bg: '#fffbeb' },
      CRITICAL: { color: '#ef4444', label: 'CRITICAL', emoji: '🔴', bg: '#fef2f2' }
    };

    const config = priorityConfig[payload.priority] || priorityConfig.INFO;
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: false
    });

    const confidenceBar = payload.metadata?.confidence !== undefined
      ? this.getConfidenceBar(Math.round(payload.metadata.confidence * 100))
      : null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${payload.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${config.color} 0%, ${this.darkenColor(config.color)} 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${config.emoji}</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">${config.label}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">

              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 22px; font-weight: 600;">
                ${payload.title}
              </h2>

              <!-- Message -->
              <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                ${payload.message}
              </p>

              <!-- Matched Keywords -->
              ${payload.metadata?.matchedKeywords && payload.metadata.matchedKeywords.length > 0 ? `
              <div style="background-color: ${config.bg}; border-left: 4px solid ${config.color}; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
                <div style="font-weight: 600; color: ${config.color}; margin-bottom: 8px; font-size: 14px;">
                  🔍 MATCHED KEYWORDS
                </div>
                <div style="color: #374151; font-size: 14px;">
                  ${payload.metadata.matchedKeywords.map((k: string) => `<span style="display: inline-block; background-color: white; padding: 4px 12px; margin: 4px 4px 0 0; border-radius: 12px; font-family: 'Courier New', monospace;">${k}</span>`).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Confidence Bar -->
              ${confidenceBar ? `
              <div style="margin: 25px 0;">
                <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px; font-size: 14px;">
                  📊 CONFIDENCE LEVEL
                </div>
                <div style="background-color: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(90deg, ${config.color} 0%, ${this.lightenColor(config.color)} 100%); height: 100%; width: ${confidenceBar}%; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600;">
                    ${confidenceBar}%
                  </div>
                </div>
              </div>
              ` : ''}

              <!-- Screenshot -->
              ${payload.screenshotPath ? `
              <div style="margin: 30px 0;">
                <div style="font-weight: 600; color: #6b7280; margin-bottom: 12px; font-size: 14px;">
                  📸 SCREENSHOT
                </div>
                <img src="cid:screenshot@monitor" alt="Screenshot" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              </div>
              ` : ''}

              <!-- CTA Button -->
              ${payload.url ? `
              <div style="text-align: center; margin: 35px 0;">
                <a href="${payload.url}" style="display: inline-block; background: ${config.color}; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  🌐 Open Website
                </a>
              </div>
              ` : ''}

              <!-- Metadata -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: #6b7280; font-size: 14px;">
                      <strong>⏰ Detected:</strong> ${timestamp}
                    </td>
                  </tr>
                  ${payload.url ? `
                  <tr>
                    <td style="color: #6b7280; font-size: 12px; padding-top: 8px; word-break: break-all;">
                      <strong>🔗 URL:</strong> ${payload.url}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                <strong>Website Change Monitor</strong>
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Monitoring the web, 24/7 🚀
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getConfidenceBar(percentage: number): number {
    return Math.min(100, Math.max(0, percentage));
  }

  private darkenColor(color: string): string {
    // Simple color darkening for gradient
    const colors: Record<string, string> = {
      '#3b82f6': '#2563eb',
      '#f59e0b': '#d97706',
      '#ef4444': '#dc2626'
    };
    return colors[color] || color;
  }

  private lightenColor(color: string): string {
    // Simple color lightening for gradient
    const colors: Record<string, string> = {
      '#3b82f6': '#60a5fa',
      '#f59e0b': '#fbbf24',
      '#ef4444': '#f87171'
    };
    return colors[color] || color;
  }
}

export const emailChannel = new EmailChannel();

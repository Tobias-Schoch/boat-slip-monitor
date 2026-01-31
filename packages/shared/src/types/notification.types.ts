import { z } from 'zod';
import { Priority } from './change.types';

export enum NotificationChannel {
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  VOICE = 'VOICE'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  changeId: z.string().uuid(),
  channel: z.nativeEnum(NotificationChannel),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(NotificationStatus),
  attempts: z.number().default(0),
  maxAttempts: z.number().default(5),
  error: z.string().optional(),
  sentAt: z.date().optional(),
  createdAt: z.date()
});

export type Notification = z.infer<typeof NotificationSchema>;

export interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  priority: Priority;
  screenshotPath?: string;
  metadata?: Record<string, any>;
}

export interface NotificationChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  priority: Priority[];
  rateLimit?: {
    maxNotifications: number;
    windowMs: number;
  };
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  error?: string;
  messageId?: string;
}

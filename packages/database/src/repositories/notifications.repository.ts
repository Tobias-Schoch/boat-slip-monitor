import { eq, and, lt } from 'drizzle-orm';
import { db } from '../client';
import { notifications } from '../schema';
import type { Notification, NotificationChannel, NotificationStatus, Priority } from '@boat-monitor/shared';

export class NotificationsRepository {
  async create(data: {
    changeId: string;
    channel: NotificationChannel;
    priority: Priority;
    status: NotificationStatus;
    attempts?: number;
    maxAttempts?: number;
  }): Promise<Notification> {
    const results = await db.insert(notifications).values(data).returning();
    return this.mapToNotification(results[0]);
  }

  async findById(id: string): Promise<Notification | undefined> {
    const results = await db.select().from(notifications).where(eq(notifications.id, id));
    return results[0] ? this.mapToNotification(results[0]) : undefined;
  }

  async findByChangeId(changeId: string): Promise<Notification[]> {
    const results = await db.select().from(notifications).where(eq(notifications.changeId, changeId));
    return results.map(this.mapToNotification);
  }

  async findPendingRetries(maxAttempts: number = 5): Promise<Notification[]> {
    const results = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.status, 'RETRYING'),
          lt(notifications.attempts, maxAttempts)
        )
      );
    return results.map(this.mapToNotification);
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string,
    messageId?: string
  ): Promise<Notification | undefined> {
    const updateData: any = { status };
    if (error) updateData.error = error;
    if (messageId) updateData.messageId = messageId;
    if (status === 'SENT') updateData.sentAt = new Date();

    const results = await db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, id))
      .returning();
    return results[0] ? this.mapToNotification(results[0]) : undefined;
  }

  async incrementAttempts(id: string): Promise<Notification | undefined> {
    const notification = await this.findById(id);
    if (!notification) return undefined;

    const results = await db
      .update(notifications)
      .set({
        attempts: notification.attempts + 1,
        status: 'RETRYING'
      })
      .where(eq(notifications.id, id))
      .returning();
    return results[0] ? this.mapToNotification(results[0]) : undefined;
  }

  private mapToNotification(notification: any): Notification {
    return {
      id: notification.id,
      changeId: notification.changeId,
      channel: notification.channel as NotificationChannel,
      priority: notification.priority as Priority,
      status: notification.status as NotificationStatus,
      attempts: notification.attempts,
      maxAttempts: notification.maxAttempts,
      error: notification.error,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt
    };
  }
}

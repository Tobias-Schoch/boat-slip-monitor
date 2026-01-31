import { eq } from 'drizzle-orm';
import { db } from '../client';
import { pgTable, uuid, varchar, text, boolean, jsonb, integer, timestamp } from 'drizzle-orm/pg-core';

// Define schema inline
export const notificationRecipients = pgTable('notification_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(),
  contact: text('contact').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  priorities: jsonb('priorities').notNull().default(['INFO', 'IMPORTANT', 'CRITICAL']),
  repeatCount: integer('repeat_count').notNull().default(1),
  delaySeconds: integer('delay_seconds').notNull().default(5),
  customMessageTemplate: text('custom_message_template'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export interface NotificationRecipient {
  id: string;
  name: string;
  channel: 'TELEGRAM' | 'EMAIL';
  contact: string;
  enabled: boolean;
  priorities: string[]; // ['INFO', 'IMPORTANT', 'CRITICAL']
  repeatCount: number;
  delaySeconds: number;
  customMessageTemplate?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RecipientsRepository {
  private mapToRecipient(row: any): NotificationRecipient {
    return {
      id: row.id,
      name: row.name,
      channel: row.channel,
      contact: row.contact,
      enabled: row.enabled,
      priorities: Array.isArray(row.priorities) ? row.priorities : [],
      repeatCount: row.repeatCount,
      delaySeconds: row.delaySeconds,
      customMessageTemplate: row.customMessageTemplate ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async findAll(): Promise<NotificationRecipient[]> {
    const results = await db.select().from(notificationRecipients);
    return results.map(this.mapToRecipient);
  }

  async findEnabled(): Promise<NotificationRecipient[]> {
    const results = await db
      .select()
      .from(notificationRecipients)
      .where(eq(notificationRecipients.enabled, true));
    return results.map(this.mapToRecipient);
  }

  async findByPriority(priority: string): Promise<NotificationRecipient[]> {
    const allRecipients = await this.findEnabled();
    return allRecipients.filter(r => r.priorities.includes(priority));
  }

  async findById(id: string): Promise<NotificationRecipient | undefined> {
    const results = await db
      .select()
      .from(notificationRecipients)
      .where(eq(notificationRecipients.id, id));
    return results[0] ? this.mapToRecipient(results[0]) : undefined;
  }

  async create(data: Omit<NotificationRecipient, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationRecipient> {
    const results = await db
      .insert(notificationRecipients)
      .values(data as any)
      .returning();
    return this.mapToRecipient(results[0]);
  }

  async update(id: string, data: Partial<NotificationRecipient>): Promise<NotificationRecipient | undefined> {
    const results = await db
      .update(notificationRecipients)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(notificationRecipients.id, id))
      .returning();
    return results[0] ? this.mapToRecipient(results[0]) : undefined;
  }

  async delete(id: string): Promise<void> {
    await db.delete(notificationRecipients).where(eq(notificationRecipients.id, id));
  }
}

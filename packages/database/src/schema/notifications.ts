import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { changes } from './changes';

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  changeId: uuid('change_id').notNull().references(() => changes.id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  error: text('error'),
  messageId: varchar('message_id', { length: 255 }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

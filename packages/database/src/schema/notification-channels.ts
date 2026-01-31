import { pgTable, uuid, varchar, boolean, text, timestamp } from 'drizzle-orm/pg-core';

export const notificationChannels = pgTable('notification_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  channel: varchar('channel', { length: 50 }).notNull().unique(),
  enabled: boolean('enabled').default(true).notNull(),
  config: text('config').notNull(),
  lastUsed: timestamp('last_used', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

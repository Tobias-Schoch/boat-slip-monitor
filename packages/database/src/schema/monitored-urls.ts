import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const monitoredUrls = pgTable('monitored_urls', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: varchar('url', { length: 1000 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  checkInterval: integer('check_interval').default(5).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  lastChecked: timestamp('last_checked', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

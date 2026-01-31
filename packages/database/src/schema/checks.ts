import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { monitoredUrls } from './monitored-urls';

export const checks = pgTable('checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  urlId: uuid('url_id').notNull().references(() => monitoredUrls.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull(),
  responseTime: integer('response_time').notNull(),
  statusCode: integer('status_code'),
  error: text('error'),
  htmlHash: varchar('html_hash', { length: 64 }),
  screenshotPath: varchar('screenshot_path', { length: 500 }),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull()
});

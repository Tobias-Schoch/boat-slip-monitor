import { pgTable, uuid, varchar, text, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { checks } from './checks';
import { monitoredUrls } from './monitored-urls';

export const changes = pgTable('changes', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  urlId: uuid('url_id').notNull().references(() => monitoredUrls.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  confidence: doublePrecision('confidence').notNull(),
  description: text('description').notNull(),
  diff: text('diff'),
  matchedKeywords: text('matched_keywords'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull()
});

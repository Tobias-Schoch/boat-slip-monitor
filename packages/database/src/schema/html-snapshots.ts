import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { checks } from './checks';

export const htmlSnapshots = pgTable('html_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  htmlHash: varchar('html_hash', { length: 64 }).notNull().unique(),
  content: text('content').notNull(),
  normalizedContent: text('normalized_content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

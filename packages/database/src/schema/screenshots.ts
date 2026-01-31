import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { checks } from './checks';

export const screenshots = pgTable('screenshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

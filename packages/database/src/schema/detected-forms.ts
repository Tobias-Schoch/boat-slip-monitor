import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { changes } from './changes';

export const detectedForms = pgTable('detected_forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  changeId: uuid('change_id').notNull().references(() => changes.id, { onDelete: 'cascade' }),
  formType: varchar('form_type', { length: 10 }).notNull(),
  formUrl: varchar('form_url', { length: 1000 }).notNull(),
  fields: text('fields').notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull()
});

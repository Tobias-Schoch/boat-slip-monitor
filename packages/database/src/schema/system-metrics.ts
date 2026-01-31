import { pgTable, uuid, varchar, doublePrecision, integer, timestamp } from 'drizzle-orm/pg-core';

export const systemMetrics = pgTable('system_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  metricValue: doublePrecision('metric_value').notNull(),
  metricUnit: varchar('metric_unit', { length: 50 }),
  tags: varchar('tags', { length: 500 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull()
});

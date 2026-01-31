import { eq } from 'drizzle-orm';
import { db } from '../client';
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

// Define schema inline since we're adding a new table
export const appSettings = pgTable('app_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export interface AppSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SettingsRepository {
  private mapToSetting(row: any): AppSetting {
    return {
      id: row.id,
      key: row.key,
      value: row.value ?? null,
      description: row.description ?? null,
      category: row.category,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async findAll(): Promise<AppSetting[]> {
    const results = await db.select().from(appSettings);
    return results.map(this.mapToSetting);
  }

  async findByCategory(category: string): Promise<AppSetting[]> {
    const results = await db.select().from(appSettings).where(eq(appSettings.category, category));
    return results.map(this.mapToSetting);
  }

  async findByKey(key: string): Promise<AppSetting | undefined> {
    const results = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return results[0] ? this.mapToSetting(results[0]) : undefined;
  }

  async getValue(key: string): Promise<string | null> {
    const setting = await this.findByKey(key);
    return setting?.value ?? null;
  }

  async updateValue(key: string, value: string): Promise<AppSetting | undefined> {
    const results = await db
      .update(appSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(appSettings.key, key))
      .returning();
    return results[0] ? this.mapToSetting(results[0]) : undefined;
  }

  async updateMultiple(updates: { key: string; value: string }[]): Promise<void> {
    for (const update of updates) {
      await this.updateValue(update.key, update.value);
    }
  }
}

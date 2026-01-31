import { eq } from 'drizzle-orm';
import { db } from '../client';
import { monitoredUrls } from '../schema';
import type { MonitoredUrl } from '@boat-monitor/shared';

export class MonitoredUrlsRepository {
  async findAll(): Promise<MonitoredUrl[]> {
    return await db.select().from(monitoredUrls);
  }

  async findById(id: string): Promise<MonitoredUrl | undefined> {
    const results = await db.select().from(monitoredUrls).where(eq(monitoredUrls.id, id));
    return results[0];
  }

  async findEnabled(): Promise<MonitoredUrl[]> {
    return await db.select().from(monitoredUrls).where(eq(monitoredUrls.enabled, true));
  }

  async create(data: Omit<MonitoredUrl, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoredUrl> {
    const results = await db.insert(monitoredUrls).values(data).returning();
    return results[0];
  }

  async update(id: string, data: Partial<MonitoredUrl>): Promise<MonitoredUrl | undefined> {
    const results = await db
      .update(monitoredUrls)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(monitoredUrls.id, id))
      .returning();
    return results[0];
  }

  async updateLastChecked(id: string): Promise<void> {
    await db
      .update(monitoredUrls)
      .set({ lastChecked: new Date(), updatedAt: new Date() })
      .where(eq(monitoredUrls.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(monitoredUrls).where(eq(monitoredUrls.id, id));
  }
}

import { eq } from 'drizzle-orm';
import { db } from '../client';
import { monitoredUrls } from '../schema';
import type { MonitoredUrl } from '@boat-monitor/shared';

export class MonitoredUrlsRepository {
  private mapToMonitoredUrl(row: any): MonitoredUrl {
    return {
      id: row.id,
      url: row.url,
      name: row.name,
      description: row.description ?? undefined,
      checkInterval: row.checkInterval,
      enabled: row.enabled,
      lastChecked: row.lastChecked ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async findAll(): Promise<MonitoredUrl[]> {
    const results = await db.select().from(monitoredUrls);
    return results.map(this.mapToMonitoredUrl);
  }

  async findById(id: string): Promise<MonitoredUrl | undefined> {
    const results = await db.select().from(monitoredUrls).where(eq(monitoredUrls.id, id));
    return results[0] ? this.mapToMonitoredUrl(results[0]) : undefined;
  }

  async findEnabled(): Promise<MonitoredUrl[]> {
    const results = await db.select().from(monitoredUrls).where(eq(monitoredUrls.enabled, true));
    return results.map(this.mapToMonitoredUrl);
  }

  async create(data: Omit<MonitoredUrl, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoredUrl> {
    const results = await db.insert(monitoredUrls).values(data as any).returning();
    return this.mapToMonitoredUrl(results[0]);
  }

  async update(id: string, data: Partial<MonitoredUrl>): Promise<MonitoredUrl | undefined> {
    const results = await db
      .update(monitoredUrls)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(monitoredUrls.id, id))
      .returning();
    return results[0] ? this.mapToMonitoredUrl(results[0]) : undefined;
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

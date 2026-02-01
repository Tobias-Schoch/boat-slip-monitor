import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { changes } from '../schema';
import type { ChangeDetection, ChangeType, Priority } from '@website-monitor/shared';

export class ChangesRepository {
  async create(data: {
    checkId: string;
    urlId: string;
    type: ChangeType;
    priority: Priority;
    confidence: number;
    description: string;
    diff?: string;
    matchedKeywords?: string[];
  }): Promise<ChangeDetection> {
    const results = await db.insert(changes).values({
      ...data,
      matchedKeywords: data.matchedKeywords ? JSON.stringify(data.matchedKeywords) : null
    }).returning();
    return this.mapToChangeDetection(results[0]);
  }

  async findById(id: string): Promise<ChangeDetection | undefined> {
    const results = await db.select().from(changes).where(eq(changes.id, id));
    return results[0] ? this.mapToChangeDetection(results[0]) : undefined;
  }

  async findByUrlId(urlId: string, limit: number = 100): Promise<ChangeDetection[]> {
    const results = await db
      .select()
      .from(changes)
      .where(eq(changes.urlId, urlId))
      .orderBy(desc(changes.detectedAt))
      .limit(limit);
    return results.map(this.mapToChangeDetection);
  }

  async findRecent(limit: number = 100): Promise<ChangeDetection[]> {
    const results = await db
      .select()
      .from(changes)
      .orderBy(desc(changes.detectedAt))
      .limit(limit);
    return results.map(this.mapToChangeDetection);
  }

  async findByPriority(priority: Priority, limit: number = 50): Promise<ChangeDetection[]> {
    const results = await db
      .select()
      .from(changes)
      .where(eq(changes.priority, priority))
      .orderBy(desc(changes.detectedAt))
      .limit(limit);
    return results.map(this.mapToChangeDetection);
  }

  private mapToChangeDetection(change: any): ChangeDetection {
    return {
      id: change.id,
      checkId: change.checkId,
      urlId: change.urlId,
      type: change.type as ChangeType,
      priority: change.priority as Priority,
      confidence: change.confidence,
      description: change.description,
      diff: change.diff,
      matchedKeywords: change.matchedKeywords ? JSON.parse(change.matchedKeywords) : undefined,
      detectedAt: change.detectedAt
    };
  }
}

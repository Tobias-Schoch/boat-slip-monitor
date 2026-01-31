import { eq, desc } from 'drizzle-orm';
import { db } from '../client';
import { checks } from '../schema';
import type { CheckResult, CheckStatus } from '@boat-monitor/shared';

export class ChecksRepository {
  async create(data: {
    urlId: string;
    status: CheckStatus;
    responseTime: number;
    statusCode?: number;
    error?: string;
    htmlHash?: string;
    screenshotPath?: string;
  }): Promise<CheckResult> {
    const results = await db.insert(checks).values(data).returning();
    return this.mapToCheckResult(results[0]);
  }

  async findById(id: string): Promise<CheckResult | undefined> {
    const results = await db.select().from(checks).where(eq(checks.id, id));
    return results[0] ? this.mapToCheckResult(results[0]) : undefined;
  }

  async findByUrlId(urlId: string, limit: number = 100): Promise<CheckResult[]> {
    const results = await db
      .select()
      .from(checks)
      .where(eq(checks.urlId, urlId))
      .orderBy(desc(checks.checkedAt))
      .limit(limit);
    return results.map(this.mapToCheckResult);
  }

  async findRecent(limit: number = 100, offset: number = 0): Promise<CheckResult[]> {
    const { monitoredUrls, changes } = await import('../schema');
    const results = await db
      .select({
        check: checks,
        url: monitoredUrls.url,
        urlName: monitoredUrls.name,
        changePriority: changes.priority
      })
      .from(checks)
      .leftJoin(monitoredUrls, eq(checks.urlId, monitoredUrls.id))
      .leftJoin(changes, eq(changes.checkId, checks.id))
      .orderBy(desc(checks.checkedAt))
      .limit(limit)
      .offset(offset);

    // Deduplicate by check ID (in case of multiple changes per check)
    const uniqueChecks = new Map<string, any>();
    for (const r of results) {
      if (!uniqueChecks.has(r.check.id)) {
        uniqueChecks.set(r.check.id, {
          ...this.mapToCheckResult(r.check),
          url: r.url || '',
          urlName: r.urlName || '',
          changePriority: r.changePriority || null
        });
      }
    }

    return Array.from(uniqueChecks.values());
  }

  async getMetricsByUrlId(urlId: string) {
    const allChecks = await db.select().from(checks).where(eq(checks.urlId, urlId));

    const totalChecks = allChecks.length;
    const successfulChecks = allChecks.filter(c => c.status === 'SUCCESS').length;
    const failedChecks = totalChecks - successfulChecks;
    const averageResponseTime =
      totalChecks > 0
        ? allChecks.reduce((sum, c) => sum + c.responseTime, 0) / totalChecks
        : 0;
    const lastCheckTime = allChecks.length > 0 ? allChecks[0].checkedAt : null;

    return {
      totalChecks,
      successfulChecks,
      failedChecks,
      averageResponseTime,
      lastCheckTime
    };
  }

  private mapToCheckResult(check: any): CheckResult {
    return {
      id: check.id,
      urlId: check.urlId,
      url: '', // Will be populated by join if needed
      status: check.status as CheckStatus,
      responseTime: check.responseTime,
      statusCode: check.statusCode,
      error: check.error,
      htmlHash: check.htmlHash,
      screenshotPath: check.screenshotPath,
      checkedAt: check.checkedAt
    };
  }
}

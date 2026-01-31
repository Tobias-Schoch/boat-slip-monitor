import { db } from '../client';
import { screenshots } from '../schema/screenshots';
import { checks } from '../schema/checks';
import { monitoredUrls } from '../schema/monitored-urls';
import { eq, desc } from 'drizzle-orm';

export interface Screenshot {
  id: string;
  checkId: string;
  filePath: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: Date;
}

export interface ScreenshotWithDetails extends Screenshot {
  url?: string;
  urlName?: string;
}

export class ScreenshotsRepository {
  async create(data: {
    checkId: string;
    filePath: string;
    fileSize: number;
    width: number;
    height: number;
  }): Promise<Screenshot> {
    const [screenshot] = await db
      .insert(screenshots)
      .values(data)
      .returning();

    return screenshot as Screenshot;
  }

  async findAll(limit: number = 50): Promise<ScreenshotWithDetails[]> {
    const results = await db
      .select({
        id: screenshots.id,
        checkId: screenshots.checkId,
        filePath: screenshots.filePath,
        fileSize: screenshots.fileSize,
        width: screenshots.width,
        height: screenshots.height,
        createdAt: screenshots.createdAt,
        url: monitoredUrls.url,
        urlName: monitoredUrls.name
      })
      .from(screenshots)
      .leftJoin(checks, eq(screenshots.checkId, checks.id))
      .leftJoin(monitoredUrls, eq(checks.urlId, monitoredUrls.id))
      .orderBy(desc(screenshots.createdAt))
      .limit(limit);

    return results as ScreenshotWithDetails[];
  }

  async findByCheckId(checkId: string): Promise<Screenshot | null> {
    const [screenshot] = await db
      .select()
      .from(screenshots)
      .where(eq(screenshots.checkId, checkId))
      .limit(1);

    return screenshot ? (screenshot as Screenshot) : null;
  }

  async deleteOld(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await db
      .delete(screenshots)
      .where(eq(screenshots.createdAt, cutoffDate));

    return deleted.length;
  }
}

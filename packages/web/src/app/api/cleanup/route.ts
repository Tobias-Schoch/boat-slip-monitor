import { NextResponse } from 'next/server';
import { db } from '@website-monitor/database/src/client';
import { checks, changes, htmlSnapshots, screenshots } from '@website-monitor/database/src/schema';

export async function POST() {
  try {
    // Delete all checks
    await db.delete(checks);

    // Delete all changes
    await db.delete(changes);

    // Delete all html_snapshots
    await db.delete(htmlSnapshots);

    // Delete all screenshots metadata
    await db.delete(screenshots);

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully. Kept: monitored_urls, settings'
    });
  } catch (error) {
    console.error('Database cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

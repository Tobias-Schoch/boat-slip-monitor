import { NextResponse } from 'next/server';
import { db } from '@boat-monitor/database/src/client';
import { checks, changes, htmlSnapshots, screenshots } from '@boat-monitor/database/src/schema';

export async function POST() {
  try {
    console.log('Starting database cleanup...');

    // Delete all checks
    await db.delete(checks);
    console.log('✓ Deleted all checks');

    // Delete all changes
    await db.delete(changes);
    console.log('✓ Deleted all changes');

    // Delete all html_snapshots
    await db.delete(htmlSnapshots);
    console.log('✓ Deleted all html_snapshots');

    // Delete all screenshots metadata
    await db.delete(screenshots);
    console.log('✓ Deleted all screenshots metadata');

    console.log('✅ Database cleanup completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully. Kept: monitored_urls, settings'
    });
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

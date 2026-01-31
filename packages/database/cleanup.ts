import { db } from './src/client';
import { checks, changes, htmlSnapshots, screenshots } from './src/schema';

async function cleanup() {
  console.log('Starting database cleanup...');

  try {
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

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('Kept: monitored_urls, settings');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();

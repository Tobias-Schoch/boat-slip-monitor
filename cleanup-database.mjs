import { db } from './packages/database/dist/client.js';
import { checks, changes, htmlSnapshots, screenshots } from './packages/database/dist/schema.js';
import { sql } from 'drizzle-orm';

console.log('Starting database cleanup...');

try {
  // Delete all checks
  const deletedChecks = await db.delete(checks);
  console.log('✓ Deleted all checks');

  // Delete all changes
  const deletedChanges = await db.delete(changes);
  console.log('✓ Deleted all changes');

  // Delete all html_snapshots
  const deletedSnapshots = await db.delete(htmlSnapshots);
  console.log('✓ Deleted all html_snapshots');

  // Delete all screenshots metadata
  const deletedScreenshots = await db.delete(screenshots);
  console.log('✓ Deleted all screenshots metadata');

  console.log('\n✅ Database cleanup completed successfully!');
  console.log('Kept: monitored_urls, settings');

  process.exit(0);
} catch (error) {
  console.error('❌ Database cleanup failed:', error);
  process.exit(1);
}

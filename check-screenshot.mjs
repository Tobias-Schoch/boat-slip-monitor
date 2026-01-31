import { db } from './packages/database/src/client.js';
import { checks } from './packages/database/src/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';

const checkId = 'e377fef0-32fd-400e-b038-455be8a5f76a';
const results = await db.select().from(checks).where(eq(checks.id, checkId));

if (results.length === 0) {
  console.log('Check not found');
} else {
  const check = results[0];
  console.log('Check found:');
  console.log('  ID:', check.id);
  console.log('  Screenshot Path:', check.screenshotPath);

  if (check.screenshotPath) {
    try {
      await fs.access(check.screenshotPath);
      console.log('  File exists: YES');
    } catch {
      console.log('  File exists: NO');
    }
  } else {
    console.log('  No screenshot path set');
  }
}

process.exit(0);

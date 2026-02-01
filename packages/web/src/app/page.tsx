import { ChecksRepository, ChangesRepository, MonitoredUrlsRepository } from '@website-monitor/database';
import { PageContent } from './page-content';

const urlsRepo = new MonitoredUrlsRepository();
const checksRepo = new ChecksRepository();
const changesRepo = new ChangesRepository();

// Force dynamic rendering to avoid pre-rendering during build
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const urls = await urlsRepo.findAll();
  const recentChecks = await checksRepo.findRecent(10);
  const recentChanges = await changesRepo.findRecent(10);

  return <PageContent urls={urls} recentChecks={recentChecks} recentChanges={recentChanges} />;
}

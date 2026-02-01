import { MonitoredUrlsRepository } from '@website-monitor/database';
import { UrlsContent } from './urls-content';

const urlsRepo = new MonitoredUrlsRepository();

export const dynamic = 'force-dynamic';

export default async function UrlsPage() {
  const urls = await urlsRepo.findAll();

  return <UrlsContent initialUrls={urls} />;
}

import { SettingsRepository } from '@website-monitor/database';
import { SettingsContent } from './settings-content';

const settingsRepo = new SettingsRepository();

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await settingsRepo.findAll();

  return <SettingsContent initialSettings={settings} />;
}

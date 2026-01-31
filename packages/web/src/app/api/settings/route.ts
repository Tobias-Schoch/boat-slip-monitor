import { NextResponse } from 'next/server';
import { SettingsRepository } from '@boat-monitor/database';

const settingsRepo = new SettingsRepository();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await settingsRepo.findAll();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updates = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    await settingsRepo.updateMultiple(updates);

    const updatedSettings = await settingsRepo.findAll();
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

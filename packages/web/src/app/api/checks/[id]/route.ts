import { NextRequest, NextResponse } from 'next/server';
import { ChecksRepository, ChangesRepository, ScreenshotsRepository } from '@website-monitor/database';

const checksRepo = new ChecksRepository();
const changesRepo = new ChangesRepository();
const screenshotsRepo = new ScreenshotsRepository();

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const checkId = params.id;

    // Get check details
    const checks = await checksRepo.findByUrlId(checkId, 1);
    if (checks.length === 0) {
      return NextResponse.json(
        { error: 'Check not found' },
        { status: 404 }
      );
    }

    const check = checks[0];

    // Get associated change if any
    const changes = await changesRepo.findByUrlId(check.urlId, 10);
    const relatedChange = changes.find(c => c.checkId === check.id);

    // Get screenshot
    const screenshot = await screenshotsRepo.findByCheckId(check.id);

    return NextResponse.json({
      check,
      change: relatedChange || null,
      screenshot: screenshot || null
    });
  } catch (error) {
    console.error('Failed to fetch check details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch check details' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ChangesRepository } from '@boat-monitor/database';

const changesRepo = new ChangesRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const urlId = searchParams.get('urlId');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let changes;
    if (urlId) {
      changes = await changesRepo.findByUrlId(urlId, limit);
    } else if (priority) {
      changes = await changesRepo.findByPriority(priority as any, limit);
    } else {
      changes = await changesRepo.findRecent(limit);
    }

    return NextResponse.json({
      success: true,
      data: changes,
      count: changes.length
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

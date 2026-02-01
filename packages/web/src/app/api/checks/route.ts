import { NextRequest, NextResponse } from 'next/server';
import { ChecksRepository } from '@website-monitor/database';

const checksRepo = new ChecksRepository();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const urlId = searchParams.get('urlId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let checks;
    if (urlId) {
      checks = await checksRepo.findByUrlId(urlId, limit);
    } else {
      checks = await checksRepo.findRecent(limit, offset);
    }

    return NextResponse.json(checks);
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

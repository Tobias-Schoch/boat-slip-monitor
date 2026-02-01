import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@website-monitor/database';

export async function GET() {
  try {
    const dbHealthy = await checkDatabaseConnection();

    if (!dbHealthy) {
      return NextResponse.json(
        { status: 'unhealthy', message: 'Database connection failed' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 503 }
    );
  }
}

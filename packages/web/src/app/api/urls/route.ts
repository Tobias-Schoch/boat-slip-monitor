import { NextResponse } from 'next/server';
import { MonitoredUrlsRepository } from '@website-monitor/database';

const urlsRepo = new MonitoredUrlsRepository();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const urls = await urlsRepo.findAll();
    return NextResponse.json({ success: true, data: urls });
  } catch (error) {
    console.error('Failed to fetch URLs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch URLs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, name, description, checkInterval, enabled } = body;

    if (!url || !name) {
      return NextResponse.json(
        { success: false, error: 'URL and name are required' },
        { status: 400 }
      );
    }

    const newUrl = await urlsRepo.create({
      url,
      name,
      description,
      checkInterval: checkInterval || 5,
      enabled: enabled !== undefined ? enabled : true
    });

    return NextResponse.json({ success: true, data: newUrl });
  } catch (error) {
    console.error('Failed to create URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create URL' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const updatedUrl = await urlsRepo.update(id, updates);

    if (!updatedUrl) {
      return NextResponse.json(
        { success: false, error: 'URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedUrl });
  } catch (error) {
    console.error('Failed to update URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update URL' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    await urlsRepo.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete URL' },
      { status: 500 }
    );
  }
}

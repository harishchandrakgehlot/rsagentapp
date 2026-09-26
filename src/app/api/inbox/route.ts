import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/auth';
import {
  getInboxMessages,
  markInboxMessageRead,
  markAllInboxMessagesRead,
  syncStoreFromCloud,
  persistStoreToCloud,
} from '@/lib/store';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = getInboxMessages({ search, unreadOnly, limit });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching inbox messages';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();
    const body = await request.json();

    if (body.action === 'mark_all_read') {
      const updated = markAllInboxMessagesRead();
      await persistStoreToCloud();
      return NextResponse.json({ success: true, count: updated });
    }

    if (body.id) {
      const updated = markInboxMessageRead(body.id, body.is_read !== false);
      if (!updated) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      await persistStoreToCloud();
      return NextResponse.json({ success: true, message: updated });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

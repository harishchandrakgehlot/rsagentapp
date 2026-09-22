import { NextResponse } from 'next/server';
import {
  getTokenById,
  updateToken,
  archiveToken,
  restoreToken,
  getRemindersByToken,
} from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const token = getTokenById(params.id);
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const reminders = getRemindersByToken(token.id);

    return NextResponse.json({ token, reminders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const body = await request.json();

    if (body.action === 'archive') {
      const token = archiveToken(params.id);
      return NextResponse.json({ success: true, token });
    }

    if (body.action === 'restore') {
      const token = restoreToken(params.id);
      return NextResponse.json({ success: true, token });
    }

    const token = updateToken(params.id, body);
    return NextResponse.json({ success: true, token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating token';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

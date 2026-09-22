import { NextResponse } from 'next/server';
import { getActivityLogs } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType') || undefined;
    const action = searchParams.get('action') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const logs = getActivityLogs({ targetType, action, search, limit });
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching activity logs';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

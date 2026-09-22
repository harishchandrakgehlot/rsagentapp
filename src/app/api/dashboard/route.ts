import { NextResponse } from 'next/server';
import { getDashboardMetrics, getTokens, getActivityLogs } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = getDashboardMetrics();
    const recentTokens = getTokens({ includeArchived: false }).slice(0, 5);
    const recentActivity = getActivityLogs({ limit: 6 });

    return NextResponse.json({
      metrics,
      recentTokens,
      recentActivity,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error loading dashboard metrics';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

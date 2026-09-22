import { NextResponse } from 'next/server';
import { getTokens, createToken } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';
import { TokenStatus } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all') as TokenStatus | 'all';
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const agentId = searchParams.get('agentId') || undefined;
    const propertyId = searchParams.get('propertyId') || undefined;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const tokens = getTokens({
      status,
      search,
      startDate,
      endDate,
      agentId,
      propertyId,
      includeArchived,
    });

    return NextResponse.json({ tokens });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching tokens';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const token = createToken(body);
    return NextResponse.json({ success: true, token });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating token';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { getTokens, getArchivedTokens } from '@/lib/store';
import { generateTokenCSV } from '@/lib/export';
import { getSuperAdminSession } from '@/lib/auth';
import { TokenStatus } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all';
    const status = (searchParams.get('status') || 'all') as TokenStatus | 'all';
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const isArchived = searchParams.get('archived') === 'true';

    let tokens;
    if (isArchived) {
      tokens = getArchivedTokens();
    } else if (scope === 'filtered') {
      tokens = getTokens({
        status,
        search,
        startDate,
        endDate,
        includeArchived: false,
      });
    } else {
      tokens = getTokens({ includeArchived: false });
    }

    const { filename, content } = generateTokenCSV(tokens);

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

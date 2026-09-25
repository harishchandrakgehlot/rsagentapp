import { NextResponse } from 'next/server';
import { getAgents, syncStoreFromCloud } from '@/lib/store';
import { generateAgentCSV } from '@/lib/export';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const agents = getAgents(includeInactive);
    const { filename, content } = generateAgentCSV(agents);

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

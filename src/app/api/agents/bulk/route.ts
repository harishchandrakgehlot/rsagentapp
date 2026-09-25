import { NextResponse } from 'next/server';
import { bulkImportAgents, BulkImportAgentInput, syncStoreFromCloud, persistStoreToCloud } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();
    const body = await request.json();
    const items = body.agents as BulkImportAgentInput[];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No agent records provided to import.' },
        { status: 400 }
      );
    }

    if (items.length > 500) {
      return NextResponse.json(
        { error: 'Bulk import limit exceeded. Maximum 500 agents per upload.' },
        { status: 400 }
      );
    }

    const result = bulkImportAgents(items);
    await persistStoreToCloud();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error executing bulk import';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getAgents, createAgent, updateAgent, toggleAgentStatus } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const agents = getAgents(includeInactive);
  return NextResponse.json({ agents });
}

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, mobile } = await request.json();
    if (!name || !mobile) {
      return NextResponse.json({ error: 'Name and mobile number are required.' }, { status: 400 });
    }

    const agent = createAgent({ name, mobile });
    return NextResponse.json({ success: true, agent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating agent';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, mobile, is_active, toggle } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required.' }, { status: 400 });
    }

    if (toggle) {
      const agent = toggleAgentStatus(id);
      return NextResponse.json({ success: true, agent });
    }

    const agent = updateAgent(id, { name, mobile, is_active });
    return NextResponse.json({ success: true, agent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating agent';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getProperties, findOrCreateProperty, updateProperty, togglePropertyStatus } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const properties = getProperties(includeInactive);
  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Property name is required.' }, { status: 400 });
    }

    const property = findOrCreateProperty(name);
    return NextResponse.json({ success: true, property });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating property';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, is_active, toggle } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required.' }, { status: 400 });
    }

    if (toggle) {
      const property = togglePropertyStatus(id);
      return NextResponse.json({ success: true, property });
    }

    const property = updateProperty(id, { name, is_active });
    return NextResponse.json({ success: true, property });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating property';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

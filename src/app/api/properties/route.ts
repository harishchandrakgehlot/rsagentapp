import { NextResponse } from 'next/server';
import {
  getProperties,
  findOrCreateProperty,
  createPropertyWithAddress,
  updateProperty,
  togglePropertyStatus,
  syncStoreFromCloud,
  persistStoreToCloud,
} from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  await syncStoreFromCloud();
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

    await syncStoreFromCloud();
    const body = await request.json();
    if (Array.isArray(body.properties)) {
      const created = body.properties.map((p: Parameters<typeof createPropertyWithAddress>[0]) => createPropertyWithAddress(p));
      await persistStoreToCloud();
      return NextResponse.json({ success: true, properties: created });
    }

    let property;
    if (body.address_line_1 || body.plot_house_no || body.city) {
      property = createPropertyWithAddress(body);
    } else if (body.name) {
      property = findOrCreateProperty(body.name);
    } else {
      return NextResponse.json({ error: 'Property address or name is required.' }, { status: 400 });
    }

    await persistStoreToCloud();
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

    await syncStoreFromCloud();
    const { id, name, is_active, toggle } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required.' }, { status: 400 });
    }

    if (toggle) {
      const property = togglePropertyStatus(id);
      await persistStoreToCloud();
      return NextResponse.json({ success: true, property });
    }

    const property = updateProperty(id, { name, is_active });
    await persistStoreToCloud();
    return NextResponse.json({ success: true, property });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating property';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

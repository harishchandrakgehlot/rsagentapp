import { NextResponse } from 'next/server';
import { getPublicToken, syncStoreFromCloud } from '@/lib/store';

export async function GET(
  request: Request,
  props: { params: Promise<{ token: string }> }
) {
  try {
    await syncStoreFromCloud();
    const params = await props.params;
    const tokenNumber = decodeURIComponent(params.token);

    const publicToken = getPublicToken(tokenNumber);

    if (!publicToken) {
      // Neutral not found response per PRD Section 8.3
      return NextResponse.json(
        { error: 'Token record not found or unavailable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ token: publicToken });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error resolving token';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

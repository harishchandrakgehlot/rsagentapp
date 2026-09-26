import { NextResponse } from 'next/server';
import { syncStoreFromCloud, getTokensByMobile } from '@/lib/store';
import { verifyAgentAuthToken } from '@/lib/agentAuth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authentication token.' },
        { status: 401 }
      );
    }

    const verification = await verifyAgentAuthToken(token);
    if (!verification.success || !verification.phone) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired agent session.' },
        { status: 401 }
      );
    }

    await syncStoreFromCloud();
    const { tokens, agentName } = getTokensByMobile(verification.phone);

    return NextResponse.json({
      success: true,
      phone: verification.phone,
      agentName: agentName || 'Agent',
      tokens,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching agent tokens';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

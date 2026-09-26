import { NextResponse } from 'next/server';
import { syncStoreFromCloud, getTokensByMobile } from '@/lib/store';
import { verifyAgentOtpSession, createAgentAuthToken } from '@/lib/agentAuth';

export async function POST(request: Request) {
  try {
    await syncStoreFromCloud();
    const body = await request.json();
    const { sessionToken, otp } = body || {};

    if (!sessionToken || typeof sessionToken !== 'string') {
      return NextResponse.json(
        { error: 'Session token is missing or expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit verification code.' },
        { status: 400 }
      );
    }

    // Verify cryptographic OTP session
    const verification = await verifyAgentOtpSession(sessionToken, otp);
    if (!verification.success || !verification.phone) {
      return NextResponse.json(
        { error: verification.error || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    const phone = verification.phone;

    // Issue 7-day authenticated agent tracking token
    const authToken = await createAgentAuthToken(phone);

    // Retrieve full token data for this agent
    const { tokens, agentName } = getTokensByMobile(phone);

    return NextResponse.json({
      success: true,
      authToken,
      phone,
      agentName: agentName || 'Agent',
      tokens,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error verifying verification code';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

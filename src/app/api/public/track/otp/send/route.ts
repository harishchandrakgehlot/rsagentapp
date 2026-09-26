import { NextResponse } from 'next/server';
import { syncStoreFromCloud, getTokensByMobile, cleanPhoneForMatch } from '@/lib/store';
import { createAgentOtpSession } from '@/lib/agentAuth';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    await syncStoreFromCloud();
    const body = await request.json();
    const rawMobile = body?.mobile;

    if (!rawMobile || typeof rawMobile !== 'string') {
      return NextResponse.json(
        { error: 'Mobile number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = cleanPhoneForMatch(rawMobile);
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Check if tokens exist for this agent / recipient
    const { tokens, agentName } = getTokensByMobile(cleanPhone);
    if (tokens.length === 0) {
      return NextResponse.json(
        {
          error:
            'No active or historical service tokens found registered with this mobile number. Please check the number or contact Royal Services administration.',
        },
        { status: 404 }
      );
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Prepare friendly WhatsApp notification text
    const greeting = agentName ? `Hello ${agentName}` : 'Hello';
    const messageBody =
      `🔐 *Royal Services — Service Token Portal*\n\n` +
      `${greeting},\n` +
      `Your verification code (OTP) to view your assigned tokens is:\n\n` +
      `👉 *${otp}*\n\n` +
      `You have *${tokens.length}* token(s) registered under this mobile number.\n` +
      `_This code is valid for 10 minutes. Please do not share it with anyone._\n\n` +
      `_Royal Services Automated Verification Engine_`;

    // Dispatch via WhatsApp Cloud API
    const sendResult = await sendDirectWhatsAppMessage({
      to: cleanPhone,
      body: messageBody,
    });

    // Create cryptographically signed session token containing OTP hash
    const sessionToken = await createAgentOtpSession(cleanPhone, otp);

    const maskedPhone = cleanPhone.length >= 10
      ? `+91 ${cleanPhone.slice(-10, -4).replace(/\d/g, '•')} ${cleanPhone.slice(-4)}`
      : cleanPhone;

    return NextResponse.json({
      success: true,
      sessionToken,
      tokenCount: tokens.length,
      maskedPhone,
      agentName: agentName || 'Agent',
      simulated: sendResult.simulated || !sendResult.success,
      devPreviewOtp:
        process.env.NODE_ENV !== 'production' || sendResult.simulated || !sendResult.success
          ? otp
          : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending verification code';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

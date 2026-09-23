import { NextResponse } from 'next/server';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';
import { getSuperAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient, message, token, phoneNumberId } = await request.json();

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    const testBody =
      message ||
      `*Royal Services - Meta WhatsApp Cloud API Test*\n\n` +
      `✅ Success! Your Meta WhatsApp Cloud API connection is active and configured.\n\n` +
      `• *Phone Number ID:* ${phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1281001591773327'}\n` +
      `• *Time:* ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
      `_Royal Services Automated Messaging Engine_`;

    const result = await sendDirectWhatsAppMessage({
      to: recipient,
      body: testBody,
      token,
      phoneNumberId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, raw: result.rawResponse },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      providerId: result.providerId,
      message: 'Test message successfully dispatched via Meta WhatsApp API!',
      raw: result.rawResponse,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending test message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

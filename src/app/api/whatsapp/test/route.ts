import { NextResponse } from 'next/server';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';
import { getSuperAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient, message, token, phoneNumberId, mode } = await request.json();

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    const isTemplate = mode === 'template';
    const testBody =
      message ||
      `*Royal Services - Meta WhatsApp Cloud API Test*\n\n` +
      `✅ Success! Your Meta WhatsApp Cloud API connection is active and configured.\n\n` +
      `• *Phone Number ID:* ${phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1387005294491815'}\n` +
      `• *Time:* ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST\n\n` +
      `_Royal Services Automated Messaging Engine_`;

    const result = await sendDirectWhatsAppMessage({
      to: recipient,
      body: isTemplate ? undefined : testBody,
      token,
      phoneNumberId,
      templateName: isTemplate ? '3p_direct_integration_test_template' : undefined,
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
      sentAs: result.sentAs,
      message: isTemplate
        ? 'Official verified template ("3p_direct_integration_test_template") delivered successfully via Meta!'
        : 'Custom test message successfully dispatched via Meta WhatsApp API!',
      raw: result.rawResponse,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending test message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

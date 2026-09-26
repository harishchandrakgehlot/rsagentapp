import { NextResponse } from 'next/server';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';
import { syncStoreFromCloud } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();

    const {
      recipient,
      message,
      token,
      phoneNumberId,
      mode,
      templateName,
      templateLanguage,
    } = await request.json();

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient phone number is required.' },
        { status: 400 }
      );
    }

    if (token && (/[^\x20-\x7E]/.test(token) || token.startsWith('❌'))) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid Meta Access Token: The token field contains an error message or non-ASCII characters (e.g. ❌). Please clear the token input and paste your actual Meta Access Token from the Meta App Dashboard.',
        },
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
      templateName: isTemplate ? (templateName || 'royal_services_notification') : undefined,
      templateLanguage: templateLanguage || 'en_US',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, raw: result.rawResponse },
        { status: 400 }
      );
    }

    const deliveredName = result.deliveredTemplate || templateName || 'hello_world';
    return NextResponse.json({
      success: true,
      providerId: result.providerId,
      sentAs: result.sentAs,
      deliveredTemplate: result.deliveredTemplate,
      message: isTemplate
        ? `Official verified template ("${deliveredName}") delivered successfully via Meta!`
        : 'Custom test message successfully dispatched via Meta WhatsApp API!',
      raw: result.rawResponse,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending test message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

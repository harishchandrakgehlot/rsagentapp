import { NextResponse } from 'next/server';
import { updateReminderDeliveryStatus } from '@/lib/store';
import { DeliveryStatus } from '@/types';

/**
 * Meta Webhook verification handshake
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'royal_services_webhook_verify_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Meta Webhook message status updates
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Check if payload contains WhatsApp status updates
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const st of statuses) {
          const messageId = st.id;
          const status = st.status as DeliveryStatus;
          const failureReason = st.errors?.[0]?.title || st.errors?.[0]?.message;

          if (messageId && status) {
            updateReminderDeliveryStatus(messageId, status, failureReason);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error processing webhook';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  updateReminderDeliveryStatus,
  recordIncomingWhatsAppMessage,
  recordOutboundWhatsAppMessage,
  syncStoreFromCloud,
  persistStoreToCloud,
} from '@/lib/store';
import { DeliveryStatus } from '@/types';

/**
 * Meta Webhook verification handshake
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: 'Webhook verify token not configured' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === expectedToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * Meta Webhook message status updates and incoming client replies
 * Verifies X-Hub-Signature-256 before processing any payload.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Verify HMAC signature to reject forged webhook payloads
    const appSecret = process.env.META_APP_SECRET;
    if (appSecret) {
      const signature = request.headers.get('x-hub-signature-256');
      const expectedSig = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
      if (!signature || signature.length !== expectedSig.length ||
          !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
      }
    } else {
      console.warn('[webhook] META_APP_SECRET not set — HMAC signature verification skipped. Set this env var for production security.');
    }

    console.log('[webhook] Incoming webhook payload:', rawBody);
    const payload = JSON.parse(rawBody);

    await syncStoreFromCloud();

    let hasMutations = false;

    // Check if payload contains WhatsApp status updates or incoming messages
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const field = change.field;

        // 1. Delivery Receipts & Statuses
        const statuses = change.value?.statuses || [];
        for (const st of statuses) {
          const messageId = st.id;
          const status = st.status as DeliveryStatus;
          const failureReason = st.errors?.[0]?.title || st.errors?.[0]?.message;

          if (messageId && status) {
            updateReminderDeliveryStatus(messageId, status, failureReason);
            hasMutations = true;
          }
        }

        // 2. Incoming Messages or Mobile App Echoes
        const messages = change.value?.messages || [];
        const contacts = change.value?.contacts || [];
        const isEcho = field === 'smb_message_echoes';

        for (const msg of messages) {
          const fromPhone = msg.from;
          const toPhone = msg.to;
          const msgType = msg.type || 'text';

          let textBody = '';
          if (msgType === 'text') {
            textBody = msg.text?.body || '';
          } else if (msgType === 'image') {
            textBody = msg.image?.caption || '[Photo / Image attachment]';
          } else if (msgType === 'document') {
            textBody = msg.document?.caption || `[Document: ${msg.document?.filename || 'File'}]`;
          } else if (msgType === 'button') {
            textBody = msg.button?.text || '[Quick reply button clicked]';
          } else if (msgType === 'interactive') {
            textBody =
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              '[Interactive reply]';
          } else {
            textBody = `[${msgType} message]`;
          }

          if (isEcho || msg.echo) {
            // Message sent by the business owner from their mobile WhatsApp app
            const targetPhone = toPhone || fromPhone;
            if (targetPhone) {
              recordOutboundWhatsAppMessage({
                provider_message_id: msg.id || `echo-${Date.now()}`,
                recipient_phone: targetPhone,
                recipient_name: 'Royal Services (Mobile)',
                message_text: textBody,
              });
              hasMutations = true;
            }
          } else {
            // Message sent by a customer/client to the business
            if (!fromPhone) continue;

            interface ContactProfile {
              wa_id?: string;
              profile?: { name?: string };
            }
            const contact = (contacts as ContactProfile[]).find(c => c.wa_id === fromPhone);
            const senderName = contact?.profile?.name;

            recordIncomingWhatsAppMessage({
              provider_message_id: msg.id || `wamid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              sender_phone: fromPhone,
              sender_name: senderName,
              message_text: textBody,
              message_type: msgType,
              timestamp: msg.timestamp
                ? new Date(Number(msg.timestamp) * 1000).toISOString()
                : new Date().toISOString(),
            });
            hasMutations = true;
          }
        }
      }
    }

    if (hasMutations) {
      await persistStoreToCloud();
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error processing webhook';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/auth';
import {
  getInboxMessages,
  getInboxThreads,
  recordOutboundWhatsAppMessage,
  markInboxMessageRead,
  markThreadRead,
  markAllInboxMessagesRead,
  syncStoreFromCloud,
  persistStoreToCloud,
} from '@/lib/store';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    const result = getInboxMessages({ search, unreadOnly, limit });
    const threads = getInboxThreads(search);

    return NextResponse.json({
      success: true,
      ...result,
      threads,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching inbox messages';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();
    const body = await request.json();
    const { recipientPhone, messageText, recipientName, linkedTokenId, linkedAgentId } = body;

    if (!recipientPhone || !messageText) {
      return NextResponse.json(
        { error: 'Recipient phone number and message text are required.' },
        { status: 400 }
      );
    }

    // Dispatch message via Meta WhatsApp Cloud API
    const sendResult = await sendDirectWhatsAppMessage({
      to: recipientPhone,
      body: messageText,
    });

    const providerId = sendResult.providerId || `wamid.OUT_${Date.now()}`;

    // Record outbound message in conversation history
    const outboundMsg = recordOutboundWhatsAppMessage({
      provider_message_id: providerId,
      recipient_phone: recipientPhone,
      recipient_name: recipientName,
      message_text: messageText,
      linked_token_id: linkedTokenId,
      linked_agent_id: linkedAgentId,
    });

    await persistStoreToCloud();

    return NextResponse.json({
      success: true,
      message: outboundMsg,
      sendResult,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error sending message';
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
    const body = await request.json();

    if (body.action === 'mark_all_read') {
      const updated = markAllInboxMessagesRead();
      await persistStoreToCloud();
      return NextResponse.json({ success: true, count: updated });
    }

    if (body.action === 'mark_thread_read' && body.phone) {
      const updated = markThreadRead(body.phone);
      await persistStoreToCloud();
      return NextResponse.json({ success: true, count: updated });
    }

    if (body.id) {
      const updated = markInboxMessageRead(body.id, body.is_read !== false);
      if (!updated) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }
      await persistStoreToCloud();
      return NextResponse.json({ success: true, message: updated });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating message';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { getTokenById, recordReminderAttempt } from '@/lib/store';
import { sendWhatsAppReminder } from '@/lib/whatsapp';
import { ReminderType } from '@/types';
import { getSuperAdminSession } from '@/lib/auth';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { reminderType } = await request.json();

    if (!reminderType || !['30_day', '15_day', '7_day', 'expiry'].includes(reminderType)) {
      return NextResponse.json(
        { error: 'Invalid or missing reminder type' },
        { status: 400 }
      );
    }

    const token = getTokenById(params.id);
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    if (token.is_archived || token.status_override) {
      return NextResponse.json(
        { error: 'Archived, cancelled, or suspended tokens are not eligible for WhatsApp reminders.' },
        { status: 400 }
      );
    }

    const sendResult = await sendWhatsAppReminder(token, reminderType as ReminderType);

    const reminder = recordReminderAttempt({
      token_id: token.id,
      reminder_type: reminderType as ReminderType,
      delivery_status: sendResult.success ? 'sent' : 'failed',
      provider_message_id: sendResult.providerId,
      failure_reason: sendResult.error,
      is_manual_resend: true,
    });

    return NextResponse.json({
      success: true,
      reminder,
      message: `Manual resend for ${reminderType} triggered successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

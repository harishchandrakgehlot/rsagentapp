import { NextResponse } from 'next/server';
import { runDailyReminderEvaluation, recordActivityLog, syncStoreFromCloud, persistStoreToCloud } from '@/lib/store';
import { sendWhatsAppReminder } from '@/lib/whatsapp';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    // Optional secret verification for Vercel Cron or webhook caller
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('Authorization');
    if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    await syncStoreFromCloud();

    const results = await runDailyReminderEvaluation(async (token, rType) => {
      return await sendWhatsAppReminder(token, rType);
    });

    recordActivityLog({
      action: 'cron_reminder_evaluation',
      target_type: 'reminder',
      target_id: 'system',
      summary: `Daily IST reminder job evaluated. Dispatched ${results.length} reminder message(s).`,
      details: { processed: results },
    });

    await persistStoreToCloud();

    return NextResponse.json({
      success: true,
      message: `Daily IST reminder job completed. Dispatched ${results.length} notifications.`,
      dispatched: results,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown cron error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/auth';
import {
  getReminderDepartureRules,
  saveReminderDepartureRules,
  resetReminderDepartureRules,
  AVAILABLE_PLACEHOLDERS,
} from '@/lib/store';
import { ReminderDepartureRule } from '@/types';

export async function GET() {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rules = getReminderDepartureRules();
    return NextResponse.json({
      success: true,
      rules,
      placeholders: AVAILABLE_PLACEHOLDERS,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching departure rules';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rules = body.rules;

    if (!Array.isArray(rules)) {
      return NextResponse.json(
        { error: 'Invalid payload: rules must be an array of departure rules.' },
        { status: 400 }
      );
    }

    // Validate each rule
    for (const r of rules) {
      if (typeof r.days_before_expiry !== 'number' || r.days_before_expiry < 0) {
        return NextResponse.json(
          { error: `Rule "${r.label || r.id}" must have a valid non-negative days_before_expiry number.` },
          { status: 400 }
        );
      }
      if (!r.label || !r.label.trim()) {
        return NextResponse.json(
          { error: 'Every departure milestone must have a descriptive title.' },
          { status: 400 }
        );
      }
      if (!r.message_template || !r.message_template.trim()) {
        return NextResponse.json(
          { error: `Message template for "${r.label}" cannot be empty.` },
          { status: 400 }
        );
      }
    }

    const cleanedRules: ReminderDepartureRule[] = rules.map((r, idx) => ({
      id: r.id || `custom_${r.days_before_expiry}_${idx}`,
      days_before_expiry: Number(r.days_before_expiry),
      label: r.label.trim(),
      is_active: Boolean(r.is_active),
      message_template: r.message_template.trim(),
      meta_template_name: r.meta_template_name?.trim() || 'royal_services_notification',
      meta_template_language: r.meta_template_language?.trim() || 'en_US',
    }));

    const saved = saveReminderDepartureRules(cleanedRules);

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${saved.length} WhatsApp departure reminder schedule(s)!`,
      rules: saved,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error saving departure rules';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const restored = resetReminderDepartureRules();
    return NextResponse.json({
      success: true,
      message: 'Departure schedule rules and message templates successfully restored to defaults.',
      rules: restored,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error resetting departure rules';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

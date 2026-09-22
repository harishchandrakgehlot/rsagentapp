import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth';
import { recordActivityLog } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);

    recordActivityLog({
      action: 'password_reset_requested',
      target_type: 'auth',
      target_id: email.trim().toLowerCase(),
      summary: `Password reset link requested for ${email}.`,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to process password reset.' },
      { status: 500 }
    );
  }
}

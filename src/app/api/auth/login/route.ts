import { NextResponse } from 'next/server';
import { authenticateSuperAdmin } from '@/lib/auth';
import { recordActivityLog } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await authenticateSuperAdmin(email, password);

    if (!result.success) {
      recordActivityLog({
        action: 'admin_login_failed',
        target_type: 'auth',
        target_id: email.trim().toLowerCase(),
        summary: `Failed login attempt for ${email}.`,
      });

      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    recordActivityLog({
      action: 'admin_login_success',
      target_type: 'auth',
      target_id: email.trim().toLowerCase(),
      summary: `Super Admin ${email} logged in successfully.`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authentication service encountered an unexpected error.' },
      { status: 500 }
    );
  }
}

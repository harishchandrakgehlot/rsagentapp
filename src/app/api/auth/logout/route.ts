import { NextResponse } from 'next/server';
import { clearSuperAdminSession } from '@/lib/auth';
import { recordActivityLog } from '@/lib/store';

export async function POST() {
  await clearSuperAdminSession();
  recordActivityLog({
    action: 'admin_logged_out',
    target_type: 'auth',
    target_id: 'super_admin',
    summary: 'Super Admin signed out.',
  });
  return NextResponse.json({ success: true });
}

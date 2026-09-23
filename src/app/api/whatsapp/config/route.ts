import { NextResponse } from 'next/server';
import { getWhatsAppToken, setWhatsAppToken } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = getWhatsAppToken();
    return NextResponse.json({
      hasToken: Boolean(token),
      tokenPreview: token ? `${token.slice(0, 10)}...${token.slice(-5)}` : null,
      phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1281001591773327',
      businessAccountId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '1112101401393002',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error checking config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    setWhatsAppToken(token);
    return NextResponse.json({
      success: true,
      message: 'Active Meta WhatsApp token saved successfully!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error saving config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

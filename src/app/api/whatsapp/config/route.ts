import { NextResponse } from 'next/server';
import { getWhatsAppConfig, setWhatsAppConfig, syncStoreFromCloud, persistStoreToCloud } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await syncStoreFromCloud();
    const config = getWhatsAppConfig();
    return NextResponse.json({
      hasToken: Boolean(config.token),
      tokenPreview: config.token ? `${config.token.slice(0, 10)}...${config.token.slice(-5)}` : null,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      businessPhone: config.businessPhone,
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

    await syncStoreFromCloud();
    const body = await request.json();
    const { token, phoneNumberId, businessAccountId, businessPhone } = body;

    if (token !== undefined && token !== null) {
      const trimmed = String(token).trim();
      if (trimmed && (/[^\x20-\x7E]/.test(trimmed) || trimmed.startsWith('❌'))) {
        return NextResponse.json(
          {
            error:
              'Invalid Meta Access Token: The token contains invalid characters or an error message (starts with ❌). Please paste your actual Meta Access Token from the Meta App Dashboard.',
          },
          { status: 400 }
        );
      }
    }

    setWhatsAppConfig({
      token: token !== undefined ? token : undefined,
      phoneNumberId: phoneNumberId !== undefined ? phoneNumberId : undefined,
      businessAccountId: businessAccountId !== undefined ? businessAccountId : undefined,
      businessPhone: businessPhone !== undefined ? businessPhone : undefined,
    });

    await persistStoreToCloud();

    return NextResponse.json({
      success: true,
      config: getWhatsAppConfig(),
      message: 'Active Meta WhatsApp configuration saved successfully!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error saving config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { getWhatsAppConfig, setWhatsAppConfig } from '@/lib/store';
import { getSuperAdminSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const config = getWhatsAppConfig();
    const token = searchParams.get('token') || config.token;
    const wabaId = searchParams.get('wabaId') || config.businessAccountId;

    if (!token) {
      return NextResponse.json(
        { error: 'Meta Access Token is required to fetch phone numbers.' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${wabaId}/phone_numbers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || 'Failed to fetch phone numbers from Meta',
          details: data.error,
        },
        { status: response.status || 400 }
      );
    }

    const numbers: Array<{
      id: string;
      display_phone_number?: string;
      verified_name?: string;
      quality_rating?: string;
      code_verification_status?: string;
    }> = data.data || [];

    const targetPhone = config.businessPhone?.replace(/\D/g, '') || '919819143222';
    const matchedNumber = numbers.find(n => {
      const clean = (n.display_phone_number || '').replace(/\D/g, '');
      return clean.includes('9819143222') || clean.includes(targetPhone.slice(-10));
    });

    if (matchedNumber) {
      setWhatsAppConfig({
        phoneNumberId: matchedNumber.id,
        businessPhone: matchedNumber.display_phone_number?.replace(/\D/g, '') || '919819143222',
      });
    }

    return NextResponse.json({
      success: true,
      numbers,
      matched: matchedNumber || null,
      activePhoneNumberId: getWhatsAppConfig().phoneNumberId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching phone numbers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

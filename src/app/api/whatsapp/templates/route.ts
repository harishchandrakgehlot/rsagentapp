import { NextResponse } from 'next/server';
import { getWhatsAppConfig } from '@/lib/store';
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
    const wabaId = searchParams.get('wabaId') || config.businessAccountId || '2150898739182078';

    if (!token) {
      return NextResponse.json(
        { error: 'Meta Access Token is required to fetch templates.' },
        { status: 400 }
      );
    }

    if (/[^\x20-\x7E]/.test(token) || token.startsWith('❌')) {
      return NextResponse.json(
        {
          error:
            'Invalid Meta Access Token: Token contains non-ASCII characters or an error message (starts with ❌).',
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${wabaId}/message_templates?limit=100`,
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
          error: data.error?.message || 'Failed to fetch templates from Meta',
          details: data.error,
        },
        { status: response.status || 400 }
      );
    }

    const templates = (data.data || []).map((t: {
      name: string;
      language: string;
      status: string;
      category?: string;
    }) => ({
      name: t.name,
      language: t.language,
      status: t.status,
      category: t.category,
    }));

    return NextResponse.json({
      success: true,
      wabaId,
      total: templates.length,
      templates,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching templates';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

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

export async function POST(request: Request) {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = getWhatsAppConfig();
    const token = body.token || config.token;
    const wabaId = body.wabaId || config.businessAccountId || '2150898739182078';
    const name = (body.name || 'royal_services_notification').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const text =
      body.text ||
      'Hello! This is an official verified notification from Royal Services. Your account messaging and reminders are active.';

    if (!token) {
      return NextResponse.json(
        { error: 'Meta Access Token is required to create a template.' },
        { status: 400 }
      );
    }

    if (/[^\x20-\x7E]/.test(token) || token.startsWith('❌')) {
      return NextResponse.json(
        { error: 'Invalid Meta Access Token.' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${wabaId}/message_templates`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category: 'UTILITY',
          components: [
            {
              type: 'BODY',
              text,
            },
          ],
          language: 'en_US',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok && data.error?.message?.toLowerCase().includes('already exists')) {
      return NextResponse.json({
        success: true,
        alreadyExisted: true,
        name,
        language: 'en_US',
        message: `Template "${name}" already exists in your Meta account! You can send it now.`,
      });
    }

    if (!response.ok || data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message || 'Failed to create template in Meta',
          details: data.error,
        },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      name,
      language: 'en_US',
      templateId: data.id,
      status: data.status || 'APPROVED',
      message: `Template "${name}" registered in Meta! Status: ${data.status || 'APPROVED'}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating template in Meta';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

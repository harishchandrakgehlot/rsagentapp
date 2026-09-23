import { Token, ReminderType } from '@/types';
import { formatReadableISTDate } from './ist';

export interface WhatsAppSendResult {
  success: boolean;
  providerId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Generates the reminder message content according to PRD section 7.2:
 * "Reminder content includes token number, property name, relevant dates, current status, and public tracking link."
 */
export function buildReminderMessageText(token: Token, reminderType: ReminderType): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';
  const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number)}`;

  let urgencyLabel = '';
  switch (reminderType) {
    case '30_day':
      urgencyLabel = '📅 30-Day Advance Expiry Notice';
      break;
    case '15_day':
      urgencyLabel = '⏳ 15-Day Expiry Notice';
      break;
    case '7_day':
      urgencyLabel = '⚠️ 7-Day Urgent Expiry Notice';
      break;
    case 'expiry':
      urgencyLabel = '🚨 Final Notice: Token Expires Today';
      break;
  }

  return (
    `*Royal Services - Token Expiry Reminder*\n\n` +
    `${urgencyLabel}\n\n` +
    `Hello *${token.agent?.name || 'Agent'}*,\n\n` +
    `This is an automated reminder regarding your assigned service token:\n\n` +
    `• *Token Number:* ${token.token_number}\n` +
    `• *Associate / Client:* ${token.associate_name}\n` +
    `• *Property:* ${token.property?.name || 'Assigned Property'}\n` +
    `• *Start Date:* ${formatReadableISTDate(token.start_date)}\n` +
    `• *End Date:* ${formatReadableISTDate(token.end_date)}\n` +
    `• *Current Status:* ${token.computed_status?.toUpperCase() || 'ACTIVE'}\n\n` +
    `Track official details and public documents:\n` +
    `${trackingUrl}\n\n` +
    `Please coordinate with the administration before the end date if renewal is required.\n\n` +
    `_Royal Services Administration Portal_`
  );
}

/**
 * Sends a WhatsApp expiry reminder via Meta WhatsApp Business Cloud API
 * or falls back to realistic simulation if credentials are not yet configured.
 */
export async function sendWhatsAppReminder(
  token: Token,
  reminderType: ReminderType
): Promise<WhatsAppSendResult> {
  const tokenSecret = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1281001591773327';
  const recipient = token.agent_mobile_number.replace(/\D/g, ''); // E.164 digits without +

  const messageText = buildReminderMessageText(token, reminderType);

  // If live Meta credentials are provided, call Meta Cloud API
  if (tokenSecret && phoneNumberId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipient,
            type: 'text',
            text: {
              preview_url: true,
              body: messageText,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error?.message || `HTTP ${response.status} from Meta API`,
        };
      }

      const msgId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
      return {
        success: true,
        providerId: msgId,
        simulated: false,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Network error communicating with Meta API';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Realistic Simulation / Development fallback
  const mockMsgId = `wamid.SIM_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  return {
    success: true,
    providerId: mockMsgId,
    simulated: true,
  };
}

/**
 * Direct message sender used for testing WhatsApp integration from Settings.
 */
export async function sendDirectWhatsAppMessage({
  to,
  body,
  token,
  phoneNumberId,
}: {
  to: string;
  body: string;
  token?: string;
  phoneNumberId?: string;
}): Promise<WhatsAppSendResult & { rawResponse?: unknown }> {
  const tokenSecret = token || process.env.META_WHATSAPP_TOKEN;
  const phoneId = phoneNumberId || process.env.META_WHATSAPP_PHONE_NUMBER_ID || '1281001591773327';
  const recipient = to.replace(/\D/g, '');

  if (!tokenSecret) {
    return {
      success: false,
      error: 'Meta WhatsApp Access Token is missing. Click "Generate token" in Meta and enter it.',
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'text',
          text: {
            preview_url: true,
            body,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status} from Meta API`,
        rawResponse: data,
      };
    }

    const msgId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
    return {
      success: true,
      providerId: msgId,
      simulated: false,
      rawResponse: data,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error communicating with Meta API';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

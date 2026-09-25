import { Token, ReminderType } from '@/types';
import { formatReadableISTDate } from './ist';
import { getWhatsAppToken, getWhatsAppPhoneNumberId } from './store';

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v25.0';

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
  const tokenSecret = getWhatsAppToken();
  const phoneNumberId = getWhatsAppPhoneNumberId();
  let recipient = token.agent_mobile_number.replace(/\D/g, ''); // E.164 digits without +
  if (recipient.length === 10) {
    recipient = `91${recipient}`;
  } else if (recipient.length === 11 && recipient.startsWith('0')) {
    recipient = `91${recipient.slice(1)}`;
  }

  const messageText = buildReminderMessageText(token, reminderType);

  // If live Meta credentials are provided, call Meta Cloud API
  if (tokenSecret && phoneNumberId) {
    if (/[^\x20-\x7E]/.test(tokenSecret) || tokenSecret.startsWith('❌')) {
      return {
        success: false,
        error: 'Invalid Meta Access Token: Token contains non-ASCII characters or an error message. Please re-enter it in Settings.',
      };
    }
    try {
      const response = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenSecret.trim()}`,
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
  templateName,
  templateLanguage = 'en_US',
}: {
  to: string;
  body?: string;
  token?: string;
  phoneNumberId?: string;
  templateName?: string;
  templateLanguage?: string;
}): Promise<
  WhatsAppSendResult & {
    rawResponse?: unknown;
    sentAs?: 'template' | 'text';
    deliveredTemplate?: string;
  }
> {
  const tokenSecret = (token || getWhatsAppToken() || '').trim();
  const phoneId = phoneNumberId || getWhatsAppPhoneNumberId();
  let recipient = to.replace(/\D/g, '');
  if (recipient.length === 10) {
    recipient = `91${recipient}`;
  } else if (recipient.length === 11 && recipient.startsWith('0')) {
    recipient = `91${recipient.slice(1)}`;
  }

  if (!tokenSecret) {
    return {
      success: false,
      error: 'Meta WhatsApp Access Token is missing. Click "Generate token" in Meta and enter it.',
    };
  }

  if (/[^\x20-\x7E]/.test(tokenSecret) || tokenSecret.startsWith('❌')) {
    return {
      success: false,
      error: 'Invalid Meta Access Token: The token field contains an error message or non-ASCII characters (e.g. ❌). Please clear the token input and paste your real token from Meta Developer Console (starts with "EAA...").',
    };
  }

  try {
    let sentAs: 'template' | 'text' = templateName ? 'template' : 'text';
    let deliveredTemplate: string | undefined;

    // Helper to send a template with given name and language
    const postTemplate = async (name: string, lang: string) => {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'template',
            template: {
              name,
              language: { code: lang },
            },
          }),
        }
      );
      const json = await res.json();
      return { response: res, data: json };
    };

    let response: Response;
    let data: any;

    if (!templateName) {
      // Send as free-form text first
      response = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`,
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
              body: body || 'Hello from Royal Services!',
            },
          }),
        }
      );
      data = await response.json();

      // If text message fails outside 24h window (code 131047), fall back to template cascade
      if (!response.ok && data.error?.code === 131047) {
        sentAs = 'template';
        templateName = 'hello_world';
      }
    }

    // If template requested or text fell back to template
    if (templateName) {
      sentAs = 'template';
      const rawCandidates = [
        { name: templateName, lang: templateLanguage },
        { name: templateName, lang: templateLanguage === 'en_US' ? 'en' : 'en_US' },
        { name: 'hello_world', lang: 'en_US' },
        { name: 'hello_world', lang: 'en' },
        { name: '3p_direct_integration_test_template', lang: 'en' },
        { name: '3p_direct_integration_test_template', lang: 'en_US' },
      ];

      // Remove duplicates preserving order
      const candidates = rawCandidates.filter(
        (c, idx, arr) => idx === arr.findIndex(x => x.name === c.name && x.lang === c.lang)
      );

      let lastErrorData = null;
      for (const cand of candidates) {
        const result = await postTemplate(cand.name, cand.lang);
        response = result.response;
        data = result.data;

        if (response.ok && !data.error) {
          deliveredTemplate = `${cand.name} (${cand.lang})`;
          break;
        }

        lastErrorData = data;
        // If error is NOT missing template translation (code 132001), stop immediately (e.g. invalid phone, bad token, payment issue)
        if (data.error?.code !== 132001) {
          break;
        }
      }

      if (!response!.ok && lastErrorData) {
        data = lastErrorData;
      }
    }

    if (!response!.ok) {
      return {
        success: false,
        error: data.error?.message || `HTTP ${response!.status} from Meta API`,
        rawResponse: { ...data, attemptedRecipient: recipient },
      };
    }

    const msgId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
    return {
      success: true,
      providerId: msgId,
      sentAs,
      deliveredTemplate,
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

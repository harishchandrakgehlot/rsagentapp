import { Token, ReminderType } from '@/types';
import { formatReadableISTDate } from './ist';
import { getWhatsAppToken, getWhatsAppPhoneNumberId, getDepartureRuleById, renderTemplateText } from './store';

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
 * Uses configured dynamic departure template if available, or falls back to built-in defaults.
 */
export function buildReminderMessageText(token: Token, reminderType: ReminderType): string {
  const rule = getDepartureRuleById(reminderType);
  if (rule && rule.message_template) {
    return renderTemplateText(rule.message_template, token, rule.days_before_expiry);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rsagentapp.vercel.app';
  const trackingUrl = `${appUrl}/track/${encodeURIComponent(token.token_number)}`;
  const agentName = token.agent?.name || 'Agent';
  const tokenNo = token.token_number;
  const associateName = token.associate_name;
  const propertyName = token.property?.name || 'Assigned Property';
  const startDate = formatReadableISTDate(token.start_date);
  const endDate = formatReadableISTDate(token.end_date);
  const status = token.computed_status?.toUpperCase() || 'ACTIVE';

  switch (reminderType) {
    case '30_day':
      return (
        `*Royal Services — 30-Day Advance Notice* 📅\n\n` +
        `Hello *${agentName}*,\n\n` +
        `This is a friendly heads-up that your service token is expiring in *30 days*. Now is the perfect time to start your renewal process to avoid any last-minute rush.\n\n` +
        `*Token Details:*\n` +
        `• Token No: ${tokenNo}\n` +
        `• Associate / Client: ${associateName}\n` +
        `• Property: ${propertyName}\n` +
        `• Start Date: ${startDate}\n` +
        `• Expiry Date: ${endDate}\n` +
        `• Status: ${status}\n\n` +
        `📎 View full details & documents:\n${trackingUrl}\n\n` +
        `Please contact the Royal Services office at your earliest convenience to initiate renewal.\n\n` +
        `_Royal Services Administration Portal_`
      );

    case '15_day':
      return (
        `*Royal Services — 15-Day Reminder* ⏳\n\n` +
        `Hello *${agentName}*,\n\n` +
        `Your service token will expire in *15 days*. Please ensure your renewal paperwork is in progress to avoid any disruption to your services.\n\n` +
        `*Token Details:*\n` +
        `• Token No: ${tokenNo}\n` +
        `• Associate / Client: ${associateName}\n` +
        `• Property: ${propertyName}\n` +
        `• Expiry Date: *${endDate}*\n` +
        `• Status: ${status}\n\n` +
        `📎 Track your token:\n${trackingUrl}\n\n` +
        `For queries or to submit renewal documents, contact the Royal Services office immediately.\n\n` +
        `_Royal Services Administration Portal_`
      );

    case '7_day':
      return (
        `*Royal Services — ⚠️ URGENT: 7-Day Expiry Warning*\n\n` +
        `Hello *${agentName}*,\n\n` +
        `*ACTION REQUIRED:* Your service token expires in just *7 days*. Failure to renew before the expiry date may result in suspension of associated services.\n\n` +
        `*Token Details:*\n` +
        `• Token No: ${tokenNo}\n` +
        `• Associate / Client: ${associateName}\n` +
        `• Property: ${propertyName}\n` +
        `• Expiry Date: *${endDate}* ⚠️\n` +
        `• Status: ${status}\n\n` +
        `📎 Track your token:\n${trackingUrl}\n\n` +
        `⚡ Please visit the Royal Services office *today* or contact us urgently to complete your renewal before the deadline.\n\n` +
        `_Royal Services Administration Portal_`
      );

    case 'expiry':
      return (
        `*Royal Services — 🚨 FINAL NOTICE: Token Expires TODAY*\n\n` +
        `Hello *${agentName}*,\n\n` +
        `Your service token has *expired today* or expires at end of day. Immediate action is required to prevent service interruption.\n\n` +
        `*Token Details:*\n` +
        `• Token No: ${tokenNo}\n` +
        `• Associate / Client: ${associateName}\n` +
        `• Property: ${propertyName}\n` +
        `• Expiry Date: *${endDate}* 🚨\n` +
        `• Status: ${status}\n\n` +
        `📎 Track your token:\n${trackingUrl}\n\n` +
        `🚨 *Please contact the Royal Services office IMMEDIATELY* to process your renewal and avoid service suspension.\n\n` +
        `_Royal Services Administration Portal_`
      );
  }
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
        templateName = 'royal_services_notification';
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
      let customError = data.error?.message || `HTTP ${response!.status} from Meta API`;
      if (data.error?.code === 131058) {
        customError = `Meta Restriction (#131058): The "hello_world" template can only be sent from Meta sandbox numbers (+1 555...). Since +91 98191 43222 is an official live business number, select "Custom Text Notification" (after sending "Hi" to +91 98191 43222 from your phone) or click "Register Production Template" to create an approved template.`;
      }
      return {
        success: false,
        error: customError,
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

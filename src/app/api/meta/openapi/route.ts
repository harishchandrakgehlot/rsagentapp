import { NextResponse } from 'next/server';
import { getSuperAdminSession } from '@/lib/auth';
import { getWhatsAppConfig } from '@/lib/store';

export async function GET() {
  try {
    const session = await getSuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getWhatsAppConfig();

    const openApiInfo = {
      specVersion: '3.0.3',
      title: 'Meta WhatsApp Business Cloud API (OpenAPI)',
      version: 'v23.0 / v25.0',
      description:
        'Official OpenAPI Specification for Meta WhatsApp Business Messaging API, sourced from facebook/openapi repository.',
      repository: {
        url: 'https://github.com/facebook/openapi',
        rawYamlUrl:
          'https://raw.githubusercontent.com/facebook/openapi/main/business-messaging-api_v23.0.yaml',
        license: 'MIT',
        maintainedBy: 'Meta Platforms, Inc.',
      },
      activeConfiguration: {
        graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v25.0',
        phoneNumberId: config.phoneNumberId || '1387005294491815',
        businessAccountId: config.businessAccountId || '2150898739182078',
        businessPhone: config.businessPhone || '919819143222',
        hasToken: Boolean(config.token),
        tokenMasked: config.token ? `${config.token.slice(0, 10)}...${config.token.slice(-6)}` : '',
      },
      categories: [
        {
          id: 'messages',
          name: 'Business Messaging API',
          description: 'Send template messages, text messages, media, and interactive notifications to users.',
          endpoints: [
            {
              id: 'send_message',
              method: 'POST',
              path: '/{phone_number_id}/messages',
              summary: 'Send WhatsApp Message (Template / Text / Media)',
              description:
                'Dispatches an automated WhatsApp template message or custom 24-hr text notification to the specified recipient phone number.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages',
              parameters: [
                {
                  name: 'phone_number_id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  example: config.phoneNumberId || '1387005294491815',
                  description: 'The Phone Number ID of the business WhatsApp account sender.',
                },
                {
                  name: 'Authorization',
                  in: 'header',
                  required: true,
                  type: 'string',
                  example: 'Bearer EAA...',
                  description: 'Meta System User Access Token with whatsapp_business_messaging permissions.',
                },
              ],
              requestBodyTemplate: {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: '919820123456',
                type: 'template',
                template: {
                  name: 'royal_services_notification',
                  language: { code: 'en_US' },
                },
              },
              requestBodyTextExample: {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: '919820123456',
                type: 'text',
                text: {
                  preview_url: true,
                  body: 'Hello from Royal Services! Your token RS-2026-001 expires in 30 days.',
                },
              },
              responses: [
                {
                  status: 200,
                  description: 'Message queued and accepted by Meta Cloud API.',
                  example: {
                    messaging_product: 'whatsapp',
                    contacts: [{ input: '919820123456', wa_id: '919820123456' }],
                    messages: [{ id: 'wamid.HBgMOTE5ODIwMTIzNDU2FQIAERgSR...' }],
                  },
                },
                {
                  status: 400,
                  description: 'Validation or Graph API error (e.g. #131058 sandbox rule, #132001 missing template translation).',
                  example: {
                    error: {
                      message: '(#131058) Hello World templates can only be sent from the Public Test Numbers',
                      type: 'OAuthException',
                      code: 131058,
                      fbtrace_id: 'Au4jckNVhLQRQnvPhwrcEzK',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'templates',
          name: 'Message Templates API',
          description: 'Query, register, and manage official pre-approved WhatsApp message templates in Meta Business Manager.',
          endpoints: [
            {
              id: 'list_templates',
              method: 'GET',
              path: '/{waba_id}/message_templates',
              summary: 'List Registered Templates',
              description: 'Fetches all registered WhatsApp message templates and their approval status under your WABA.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates',
              parameters: [
                {
                  name: 'waba_id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  example: config.businessAccountId || '2150898739182078',
                  description: 'WhatsApp Business Account ID.',
                },
                {
                  name: 'limit',
                  in: 'query',
                  required: false,
                  type: 'integer',
                  example: '100',
                  description: 'Maximum number of templates to retrieve.',
                },
              ],
              responses: [
                {
                  status: 200,
                  description: 'List of templates retrieved successfully.',
                  example: {
                    data: [
                      {
                        name: 'royal_services_notification',
                        status: 'APPROVED',
                        category: 'UTILITY',
                        language: 'en_US',
                        id: '984572918274619',
                      },
                    ],
                  },
                },
              ],
            },
            {
              id: 'create_template',
              method: 'POST',
              path: '/{waba_id}/message_templates',
              summary: 'Create & Register Template',
              description: 'Submits a new template definition to Meta for automated approval.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates',
              parameters: [
                {
                  name: 'waba_id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  example: config.businessAccountId || '2150898739182078',
                  description: 'WhatsApp Business Account ID.',
                },
              ],
              requestBodyTemplate: {
                name: 'royal_services_notification',
                category: 'UTILITY',
                language: 'en_US',
                components: [
                  {
                    type: 'BODY',
                    text: 'Hello! This is an official verified notification from Royal Services. Your account messaging and reminders are active.',
                  },
                ],
              },
              responses: [
                {
                  status: 200,
                  description: 'Template created and submitted for approval.',
                  example: {
                    id: '984572918274619',
                    status: 'APPROVED',
                    category: 'UTILITY',
                  },
                },
              ],
            },
            {
              id: 'delete_template',
              method: 'DELETE',
              path: '/{waba_id}/message_templates?name={template_name}',
              summary: 'Delete Message Template',
              description: 'Deletes a template by name from your WhatsApp Business Account.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates',
              parameters: [
                {
                  name: 'waba_id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  example: config.businessAccountId || '2150898739182078',
                },
                {
                  name: 'name',
                  in: 'query',
                  required: true,
                  type: 'string',
                  example: 'royal_services_notification',
                },
              ],
              responses: [
                {
                  status: 200,
                  description: 'Template deletion confirmed.',
                  example: { success: true },
                },
              ],
            },
          ],
        },
        {
          id: 'phone_numbers',
          name: 'Phone Numbers & Status API',
          description: 'Manage sender phone numbers, verification names, and quality health rating.',
          endpoints: [
            {
              id: 'get_phone_info',
              method: 'GET',
              path: '/{phone_number_id}',
              summary: 'Get Phone Number Details & Quality',
              description: 'Inspects verified display name, quality rating (GREEN, YELLOW, RED), and verification status.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers',
              parameters: [
                {
                  name: 'phone_number_id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  example: config.phoneNumberId || '1387005294491815',
                },
              ],
              responses: [
                {
                  status: 200,
                  description: 'Phone details retrieved.',
                  example: {
                    verified_name: 'Royal Services Admin',
                    display_phone_number: '+91 98191 43222',
                    id: '1387005294491815',
                    quality_rating: 'GREEN',
                    code_verification_status: 'VERIFIED',
                  },
                },
              ],
            },
            {
              id: 'list_phone_numbers',
              method: 'GET',
              path: '/{waba_id}/phone_numbers',
              summary: 'List All Phone Numbers under WABA',
              description: 'Queries all registered phone numbers connected to the WhatsApp Business Account.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/business-management-api/manage-phone-numbers',
              parameters: [
                {
                  name: 'waba_id',
                  in: 'path',
                  required: true,
                  type: 'string',
                  example: config.businessAccountId || '2150898739182078',
                },
              ],
              responses: [
                {
                  status: 200,
                  description: 'List of phone numbers.',
                  example: {
                    data: [
                      {
                        verified_name: 'Royal Services Admin',
                        display_phone_number: '+91 98191 43222',
                        id: '1387005294491815',
                        quality_rating: 'GREEN',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'webhooks',
          name: 'Webhooks & Events',
          description: 'Receive real-time notifications for incoming WhatsApp messages and delivery status updates.',
          endpoints: [
            {
              id: 'webhook_verify',
              method: 'GET',
              path: '/api/webhooks/whatsapp',
              summary: 'Webhook Subscription Handshake',
              description: 'Verifies the hub.challenge against the royal_services_webhook_verify_2026 verify token.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components',
              parameters: [
                { name: 'hub.mode', in: 'query', type: 'string', example: 'subscribe' },
                { name: 'hub.verify_token', in: 'query', type: 'string', example: 'royal_services_webhook_verify_2026' },
                { name: 'hub.challenge', in: 'query', type: 'string', example: '1158201444' },
              ],
              responses: [
                { status: 200, description: 'Returns hub.challenge plain text.' },
              ],
            },
            {
              id: 'webhook_event',
              method: 'POST',
              path: '/api/webhooks/whatsapp',
              summary: 'Inbound Webhook Event Payload',
              description: 'Receives delivery status receipts (sent, delivered, read, failed) and incoming customer replies.',
              docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components',
              requestBodyTemplate: {
                object: 'whatsapp_business_account',
                entry: [
                  {
                    id: '2150898739182078',
                    changes: [
                      {
                        value: {
                          messaging_product: 'whatsapp',
                          metadata: { display_phone_number: '919819143222', phone_number_id: '1387005294491815' },
                          statuses: [{ id: 'wamid...', status: 'delivered', recipient_id: '919820123456' }],
                        },
                        field: 'messages',
                      },
                    ],
                  },
                ],
              },
              responses: [
                { status: 200, description: 'EVENT_RECEIVED acknowledgement.' },
              ],
            },
          ],
        },
      ],
    };

    return NextResponse.json({
      success: true,
      openApi: openApiInfo,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error preparing OpenAPI info';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

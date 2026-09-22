import { Token, Agent } from '@/types';
import { getCurrentISTDateString, formatReadableISTDate } from './ist';

/**
 * Escapes CSV fields to prevent CSV / Formula Injection attacks (CWE-1236).
 * Values starting with =, +, -, @, or tab/CR are prepended with an apostrophe.
 */
export function sanitizeCSVValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // If starts with dangerous formula characters, prepend with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape any existing quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates Token CSV for authenticated Super Admin
 */
export function generateTokenCSV(tokens: Token[]): { filename: string; content: string } {
  const istDate = getCurrentISTDateString();
  const filename = `RoyalServices_Tokens_${istDate}.csv`;

  const headers = [
    'Token Number',
    'Associate Name',
    'Agent Name',
    'Agent Mobile Number',
    'Property Name',
    'Start Date (IST)',
    'End Date (IST)',
    'Status',
    'Manual Override',
    'Is Archived',
    'Renewal Reference',
    'Token Description',
    'Notes and Remarks',
    'Created At',
  ];

  const rows = tokens.map(t => [
    sanitizeCSVValue(t.token_number),
    sanitizeCSVValue(t.associate_name),
    sanitizeCSVValue(t.agent?.name || 'N/A'),
    sanitizeCSVValue(t.agent_mobile_number), // Private admin export only!
    sanitizeCSVValue(t.property?.name || 'N/A'),
    sanitizeCSVValue(formatReadableISTDate(t.start_date)),
    sanitizeCSVValue(formatReadableISTDate(t.end_date)),
    sanitizeCSVValue((t.computed_status || 'active').toUpperCase()),
    sanitizeCSVValue(t.status_override ? t.status_override.toUpperCase() : 'None'),
    sanitizeCSVValue(t.is_archived ? 'YES' : 'NO'),
    sanitizeCSVValue(t.renewal_previous_token?.token_number || t.renewal_reference_id || 'None'),
    sanitizeCSVValue(t.token_description || ''),
    sanitizeCSVValue(t.notes_and_remarks || ''),
    sanitizeCSVValue(t.created_at),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel
    [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');

  return { filename, content: csvContent };
}

/**
 * Generates Agent CSV for authenticated Super Admin
 */
export function generateAgentCSV(agents: Agent[]): { filename: string; content: string } {
  const istDate = getCurrentISTDateString();
  const filename = `RoyalServices_Agents_${istDate}.csv`;

  const headers = [
    'Agent ID',
    'Full Name',
    'Mobile Number (+91)',
    'Status',
    'Created At',
  ];

  const rows = agents.map(a => [
    sanitizeCSVValue(a.id),
    sanitizeCSVValue(a.name),
    sanitizeCSVValue(a.mobile),
    sanitizeCSVValue(a.is_active ? 'ACTIVE' : 'INACTIVE'),
    sanitizeCSVValue(a.created_at),
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');

  return { filename, content: csvContent };
}

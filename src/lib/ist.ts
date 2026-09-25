import { TokenStatus, StatusOverride, ReminderType } from '@/types';

/**
 * Returns current date and time formatted in India Standard Time (IST: UTC+5:30)
 */
export function getISTNow(): Date {
  const now = new Date();
  // IST offset is UTC + 5 hours 30 minutes = +330 minutes
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 330 * 60000);
}

/**
 * Returns current IST date string in YYYY-MM-DD format
 */
export function getCurrentISTDateString(): string {
  const ist = getISTNow();
  return formatToYYYYMMDD(ist);
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD as an IST Date object (midnight IST)
 */
export function parseISTDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into a human readable Indian format: e.g. "22 Sep 2026"
 */
export function formatReadableISTDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const parsed = new Date(dateStr);
    return parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a timestamp into human readable IST format: e.g. "22 Sep 2026, 05:25 PM IST"
 */
export function formatReadableISTDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return `${new Intl.DateTimeFormat('en-IN', options).format(d)} IST`;
  } catch {
    return isoString;
  }
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD dates: (dateB - dateA)
 */
export function diffCalendarDays(dateAStr: string, dateBStr: string): number {
  const dateA = parseISTDate(dateAStr);
  const dateB = parseISTDate(dateBStr);
  const diffTime = dateB.getTime() - dateA.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates the token status based on current IST date and PRD business rules
 */
export function computeTokenStatus(
  startDate: string,
  endDate: string,
  statusOverride?: StatusOverride,
  isArchived: boolean = false
): TokenStatus {
  if (isArchived) {
    return 'archived';
  }

  if (statusOverride === 'suspended') {
    return 'suspended';
  }

  if (statusOverride === 'cancelled') {
    return 'cancelled';
  }

  const currentIST = getCurrentISTDateString();

  if (currentIST < startDate) {
    return 'upcoming';
  }

  if (currentIST >= startDate && currentIST <= endDate) {
    return 'active';
  }

  return 'expired';
}

/**
 * Computes scheduled reminder dates for an end date in IST
 */
export function calculateReminderDates(endDateStr: string): Record<ReminderType, string> {
  const end = parseISTDate(endDateStr);

  const getShiftedDate = (daysBefore: number) => {
    const d = new Date(end);
    d.setDate(d.getDate() - daysBefore);
    return formatToYYYYMMDD(d);
  };

  return {
    '30_day': getShiftedDate(30),
    '15_day': getShiftedDate(15),
    '7_day': getShiftedDate(7),
    'expiry': endDateStr,
  };
}

/**
 * Checks if a reminder type is due today in IST for a given end date
 */
export function isReminderDueToday(endDateStr: string, reminderType: ReminderType): boolean {
  const today = getCurrentISTDateString();
  const reminderDates = calculateReminderDates(endDateStr);
  return reminderDates[reminderType] === today;
}

/**
 * Checks how many days remain until expiry from today in IST
 */
export function getDaysUntilExpiry(endDateStr: string): number {
  const today = getCurrentISTDateString();
  return diffCalendarDays(today, endDateStr);
}

/**
 * Checks if a reminder configured for a specific number of days before expiry is due today in IST
 */
export function isReminderDueTodayForDays(endDateStr: string, daysBefore: number): boolean {
  const today = getCurrentISTDateString();
  const end = parseISTDate(endDateStr);
  const targetDate = new Date(end);
  targetDate.setDate(targetDate.getDate() - daysBefore);
  return formatToYYYYMMDD(targetDate) === today;
}

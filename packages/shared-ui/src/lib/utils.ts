import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

let currencyCode = 'PHP';
let currencySymbol = '₱';

export function setCurrencyMeta(meta: { code?: string; symbol?: string }): void {
  if (meta.code) currencyCode = meta.code;
  if (meta.symbol) currencySymbol = meta.symbol;
}

export function formatCurrency(value?: number | string | null): string {
  if (value === undefined || value === null) return '—';
  const numValue = Number(value);
  if (isNaN(numValue)) return '—';

  const sign = numValue < 0 ? '-' : '';
  const num = Math.abs(numValue).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currencySymbol) return `${sign}${currencySymbol}${num}`;
  try {
    return `${sign}${new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(numValue))}`;
  } catch {
    return `${sign}${currencyCode} ${num}`;
  }
}

/**
 * Formats raw snake_case or SCREAMING_SNAKE_CASE enum strings into human-readable Title Case for UI display.
 * Examples:
 * - 'phone_call' -> 'Phone Call'
 * - 'reminder_email' -> 'Reminder Email'
 * - 'under_maintenance' -> 'Under Maintenance'
 */
export function formatEnumLabel(value?: string | null): string {
  if (!value) return '';
  return value
    .split(/[_-\s]+/)
    .map((word) => {
      // Preserve uppercase acronyms like AP, SMS, ID, PNL
      if (['ap', 'sms', 'id', 'pnl', 'rto', 'ac', 'po'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrency as formatCurrencyAware } from './settings-store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Delegate to the tenant-aware formatter (reads currency/currencySymbol from
// company settings, defaulting to PHP/₱). Previously this hardcoded USD.
export function formatCurrency(value: number | string | null | undefined): string {
  return formatCurrencyAware(value);
}

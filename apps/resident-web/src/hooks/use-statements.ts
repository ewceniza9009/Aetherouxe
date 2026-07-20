import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import type { ApiResponse } from '@elite-realty/shared-types';

export type StatementStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Statement {
  id: string;
  tenantId?: string | null;
  ownerName: string;
  propertyName?: string | null;
  period: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  billedAmount: number;
  paidAmount: number;
  closingBalance: number;
  status: StatementStatus;
  generatedAt?: string | null;
  createdAt: string;
}

export function useMyStatements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-statements', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set('tenantId', user.id);
      const { data } = await api.get<ApiResponse<Statement[]>>(`/statements?${params.toString()}`);
      return (data.data ?? []) as Statement[];
    },
    enabled: !!user?.id,
  });
}

export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// Tenant-aware currency formatting. Defaults to PHP/₱ to match the company
// settings (currency: 'PHP', currencySymbol: '₱') used across the platform.
let currencyCode = 'PHP';
let currencySymbol = '₱';

export function setCurrencyMeta(meta: { code?: string; symbol?: string }): void {
  if (meta.code) currencyCode = meta.code;
  if (meta.symbol) currencySymbol = meta.symbol;
}

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return '—';
  const sign = value < 0 ? '-' : '';
  const num = Math.abs(value).toLocaleString(undefined, {
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
    }).format(Math.abs(value))}`;
  } catch {
    return `${sign}${currencyCode} ${num}`;
  }
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

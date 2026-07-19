import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import type { ApiResponse } from '@elite-realty/shared-types';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type OwnerPnlStatus = 'draft' | 'published' | 'final';

export interface OwnerPnl {
  id: string;
  propertyId?: string | null;
  propertyName: string;
  period: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  grossIncome: number;
  totalExpenses: number;
  netIncome: number;
  yieldPct?: number | null;
  status: OwnerPnlStatus;
  generatedAt?: string | null;
  createdAt: string;
}

export type OwnerDocumentType =
  'lease' | 'statement' | 'tax' | 'legal' | 'deed' | 'report' | 'insurance' | 'id' | 'other';

export interface OwnerDocument {
  id: string;
  title: string;
  documentType: OwnerDocumentType;
  fileUrl?: string | null;
  isSigned: boolean;
  signedAt?: string | null;
  expiryDate?: string | null;
  propertyName?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ *
 * Small inline color / label maps
 * ------------------------------------------------------------------ */

export const PNL_STATUS_STYLES: Record<OwnerPnlStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  published: { label: 'Published', className: 'bg-blue-100 text-blue-700' },
  final: { label: 'Final', className: 'bg-emerald-100 text-emerald-700' },
};

export const DOCUMENT_TYPE_STYLES: Record<OwnerDocumentType, { label: string; className: string }> =
  {
    lease: { label: 'Lease', className: 'bg-violet-100 text-violet-700' },
    statement: { label: 'Statement', className: 'bg-sky-100 text-sky-700' },
    tax: { label: 'Tax', className: 'bg-rose-100 text-rose-700' },
    legal: { label: 'Legal', className: 'bg-indigo-100 text-indigo-700' },
    deed: { label: 'Deed', className: 'bg-amber-100 text-amber-700' },
    report: { label: 'Report', className: 'bg-teal-100 text-teal-700' },
    insurance: { label: 'Insurance', className: 'bg-cyan-100 text-cyan-700' },
    id: { label: 'ID', className: 'bg-fuchsia-100 text-fuchsia-700' },
    other: { label: 'Other', className: 'bg-slate-100 text-slate-700' },
  };

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */

export function useMyPnl() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-pnl', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set('ownerId', user.id);
      const { data } = await api.get<ApiResponse<OwnerPnl[]>>(`/owner-pnl?${params.toString()}`);
      return (data.data ?? []) as OwnerPnl[];
    },
    enabled: !!user?.id,
  });
}

export function useMyDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-documents', user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('ownerType', 'owner');
      if (user?.id) params.set('ownerId', user.id);
      const { data } = await api.get<ApiResponse<OwnerDocument[]>>(
        `/documents?${params.toString()}`,
      );
      return (data.data ?? []) as OwnerDocument[];
    },
    enabled: !!user?.id,
  });
}

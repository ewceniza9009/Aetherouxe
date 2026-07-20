import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import type { ApiResponse } from '@elite-realty/shared-types';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type OwnerPnlStatus = 'draft' | 'issued';

export interface OwnerPnl {
  id: string;
  propertyId?: string | null;
  propertyName: string;
  period: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  grossRentalIncome: number;
  totalExpenses: number;
  managementFee: number;
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

export interface PortfolioStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  totalNetIncome: number;
  totalGrossIncome: number;
  totalExpenses: number;
  avgYield: number;
}

export interface OwnerProperty {
  id: string;
  name: string;
  propertyCode: string;
  propertyType: string;
  status: string;
  totalUnits: number;
  occupiedUnits: number;
  occupancy: number;
  monthlyIncome: number;
  annualNoi: number;
  imageUrl: string | null;
}

export interface OwnerFinancials {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalNetIncome: number;
    avgYield: number;
    statementCount: number;
  };
  statements: {
    id: string;
    propertyName: string;
    propertyType: string;
    periodStart: string | null;
    periodEnd: string | null;
    grossRentalIncome: number;
    expenses: number;
    netIncome: number;
    yield: number;
    status: string;
    generatedAt: string | null;
  }[];
}

/* ------------------------------------------------------------------ *
 * Small inline color / label maps
 * ------------------------------------------------------------------ */

export const PNL_STATUS_STYLES: Record<OwnerPnlStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  issued: { label: 'Issued', className: 'bg-emerald-100 text-emerald-700' },
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
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */

export function usePortfolioStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-portfolio-stats', user?.id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PortfolioStats>>('/owner-portal/portfolio-stats');
      return (data.data ?? data) as PortfolioStats;
    },
    enabled: !!user?.id,
  });
}

export function useMyProperties() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OwnerProperty[]>>('/owner-portal/properties');
      return (data.data ?? []) as OwnerProperty[];
    },
    enabled: !!user?.id,
  });
}

export function useMyFinancials() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['owner-financials', user?.id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OwnerFinancials>>('/owner-portal/financials');
      return (data.data ?? data) as OwnerFinancials;
    },
    enabled: !!user?.id,
  });
}

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

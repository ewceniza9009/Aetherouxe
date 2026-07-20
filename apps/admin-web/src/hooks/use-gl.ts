import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';

export interface GlEntry {
  id: string;
  reference?: string;
  date: string;
  notes?: string;
  lines: GlEntryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface GlEntryLine {
  id: string;
  accountId: string;
  account?: {
    accountCode: string;
    name: string;
  };
  debitAmount: number;
  creditAmount: number;
  description?: string;
}

export interface Account {
  id: string;
  accountCode: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GlEntriesParams {
  search?: string;
  function?: string;
  page?: number;
  limit?: number;
}

export interface GlEntriesResponse {
  data: GlEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: { totalDebit: number; totalCredit: number; balance: number };
}

export function useGeneralLedgerEntries(params: GlEntriesParams = {}) {
  return useQuery({
    queryKey: ['general-ledger-entries', params],
    queryFn: async () => {
      const qp = new URLSearchParams();
      if (params.search) qp.set('search', params.search);
      if (params.function && params.function !== 'all') qp.set('function', params.function);
      if (params.page) qp.set('page', String(params.page));
      if (params.limit) qp.set('limit', String(params.limit));
      const qs = qp.toString();
      const { data } = await api.get(`/general-ledger/entries${qs ? `?${qs}` : ''}`);
      return (data?.data ?? data) as GlEntriesResponse;
    },
  });
}

export function useChartOfAccounts() {
  return useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data } = await api.get('/general-ledger/coa');
      return data?.data ?? data;
    },
  });
}

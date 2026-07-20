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

export function useGeneralLedgerEntries() {
  return useQuery({
    queryKey: ['general-ledger-entries'],
    queryFn: async () => {
      const { data } = await api.get('/general-ledger/entries');
      return data?.data ?? data;
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

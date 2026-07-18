import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

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

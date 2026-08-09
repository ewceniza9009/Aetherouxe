import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
}

export interface RewardLedgerEntry {
  id: string;
  points: number;
  transactionType: 'earned' | 'redeemed';
  notes: string;
  createdAt: string;
}

export function useRewardCatalog() {
  return useQuery({
    queryKey: ['rewards', 'catalog'],
    queryFn: async () => {
      const { data } = await api.get<any>('/rewards/catalog');
      return data.data;
    },
  });
}

export function useRewardBalance() {
  return useQuery({
    queryKey: ['rewards', 'balance'],
    queryFn: async () => {
      const { data } = await api.get<any>('/rewards/balance');
      return data.data;
    },
  });
}

export function useRewardLedger() {
  return useQuery({
    queryKey: ['rewards', 'ledger'],
    queryFn: async () => {
      const { data } = await api.get<any>('/rewards/ledger');
      return data.data;
    },
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rewardItemId: string) => {
      const { data } = await api.post('/rewards/redeem', { rewardItemId });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards', 'balance'] });
      qc.invalidateQueries({ queryKey: ['rewards', 'ledger'] });
    },
  });
}

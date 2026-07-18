import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useApInvoices() {
  return useQuery({
    queryKey: ['ap-invoices'],
    queryFn: async () => {
      const { data } = await api.get('/ap-invoices');
      return data;
    },
  });
}

export function useDisburse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      const { data } = await api.post(`/ap-invoices/${id}/disburse`, { amount, notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ap-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['general-ledger-entries'] }); // Disbursing creates a JE
    },
  });
}

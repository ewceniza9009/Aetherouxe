import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PaginationMeta } from '@elite-realty/shared-types';

export function useApInvoices(query?: { page?: number; limit?: number; sort?: string; order?: "asc" | "desc" }) {
  return useQuery({
    queryKey: ['ap-invoices', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set("page", String(query.page));
      if (query?.limit) params.set("limit", String(query.limit));
      if (query?.sort) params.set("sort", query.sort);
      if (query?.order) params.set("order", String(query.order));
      const qs = params.toString();
      const { data } = await api.get(`/ap-invoices${qs ? `?${qs}` : ""}`);
      return { data: data.data ?? [], meta: data.meta } as { data: any[]; meta: PaginationMeta };
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

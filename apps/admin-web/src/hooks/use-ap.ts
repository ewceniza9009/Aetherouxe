import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { PaginationMeta } from '@elite-realty/shared-types';

export type ApInvoiceStatus = 'pending_approval' | 'approved' | 'paid' | 'rejected';

export interface ApInvoice {
  id: string;
  sourceType: string;
  sourceId?: string | null;
  vendorId?: string | null;
  invoiceNumber?: string | null;
  amount: number;
  status: ApInvoiceStatus;
  notes?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: { id: string; companyName?: string | null } | null;
  disbursements?: { id: string; amount: number; paymentDate: string }[];
}

export function useApInvoices(query?: {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: string;
}) {
  return useQuery({
    queryKey: ['ap-invoices', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set('page', String(query.page));
      if (query?.limit) params.set('limit', String(query.limit));
      if (query?.sort) params.set('sort', query.sort);
      if (query?.order) params.set('order', String(query.order));
      if (query?.status) params.set('status', query.status);
      const qs = params.toString();
      const { data } = await api.get(`/ap-invoices${qs ? `?${qs}` : ''}`);
      return { data: (data.data ?? []) as ApInvoice[], meta: data.meta } as {
        data: ApInvoice[];
        meta: PaginationMeta;
      };
    },
  });
}

export function useApproveApInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/ap-invoices/${id}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ap-invoices'] });
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
      queryClient.invalidateQueries({ queryKey: ['general-ledger-entries'] });
    },
  });
}

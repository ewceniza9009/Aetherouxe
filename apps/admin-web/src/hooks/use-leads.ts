import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { PaginationMeta } from '@elite-realty/shared-types';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  propertyId: string | null;
  assignedToId: string | null;
  property?: { id: string; propertyCode: string } | null;
  assignedTo?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadQuery {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  search?: string;
}

export function useLeads(query?: LeadQuery) {
  return useQuery({
    queryKey: ['leads', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.set('page', String(query.page));
      if (query?.limit) params.set('limit', String(query.limit));
      if (query?.status) params.set('status', query.status);
      if (query?.search) params.set('search', query.search);
      const qs = params.toString();
      const { data } = await api.get(`/leads${qs ? `?${qs}` : ''}`);
      return { data: (data.data ?? []) as Lead[], meta: data.meta as PaginationMeta };
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Lead>) => {
      const { data } = await api.post('/leads', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Lead> & { id: string }) => {
      const { data } = await api.patch(`/leads/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/leads/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

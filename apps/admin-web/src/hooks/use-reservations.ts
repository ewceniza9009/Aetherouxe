import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { ApiResponse, PaginationMeta } from '@elite-realty/shared-types';

export type ReservationStatus = 'reserved' | 'converted' | 'expired' | 'cancelled';

export interface Reservation {
  id: string;
  unitId: string;
  schemeId: string;
  tenantId: string;
  prospectName: string;
  prospectContact?: string;
  optionFeeAmount: number | null;
  holdingFeeCollected: boolean;
  holdDays: number;
  holdExpiry: string;
  status: ReservationStatus;
  convertedLeaseId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  unit?: {
    id: string;
    unitNumber: string;
    listPrice: number | null;
    status: string;
    buildingId: string;
  };
  scheme?: {
    id: string;
    code: string;
    name?: string;
    schemeType: string;
    optionFeePercent?: number | null;
  };
  lease?: { id: string } | null;
}

export interface ReservationQuery {
  unitId?: string;
  status?: ReservationStatus | 'all';
  tenantId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export function useReservations(query: ReservationQuery = {}) {
  return useQuery({
    queryKey: ['reservations', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.unitId) params.set('unitId', query.unitId);
      if (query.status && query.status !== 'all') params.set('status', query.status);
      if (query.tenantId) params.set('tenantId', query.tenantId);
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      const { data } = await api.get<ApiResponse<Reservation[]>>(`/reservations?${params}`);
      return { data: data.data ?? [], meta: data.meta } as {
        data: Reservation[];
        meta: PaginationMeta;
      };
    },
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Reservation>>(`/reservations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      unitId: string;
      schemeId: string;
      prospectName: string;
      prospectContact?: string;
      holdDays?: number;
      collectFeeNow?: boolean;
      totalContractValue?: number;
      notes?: string;
    }) => {
      const { data } = await api.post<ApiResponse<Reservation>>('/reservations', payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Reservation> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Reservation>>(`/reservations/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['reservation', result.id] });
    },
  });
}

export function useConvertReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      performedByUserId: string;
      buyerUserId: string;
      agentId: string;
      totalContractValue?: number;
      monthlyRentAmount?: number;
    }) => {
      const { data } = await api.post<ApiResponse<any>>(`/reservations/${id}/convert`, payload);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['units'] });
      qc.invalidateQueries({ queryKey: ['leases'] });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<{ id: string; status: string }>>(
        `/reservations/${id}/cancel`,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      qc.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useReservationsByUnit(unitId: string) {
  return useQuery({
    queryKey: ['reservations', 'unit', unitId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Reservation[]>>(`/reservations/unit/${unitId}`);
      return data.data ?? [];
    },
    enabled: !!unitId,
  });
}

export function useExpireOverdueReservations() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ expired: number }>>(
        '/reservations/expire-overdue',
      );
      return data.data;
    },
  });
}

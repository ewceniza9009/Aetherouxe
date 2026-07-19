import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { ApiResponse } from '@elite-realty/shared-types';

export type UtilityType = 'water' | 'electricity' | 'gas';

export type UtilityBillStatus = 'pending' | 'paid' | 'partially_paid' | 'waived' | 'disputed';

export interface UtilityMeterTenant {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface UtilityMeterUnit {
  id: string;
  unitLabel?: string | null;
}

export interface UtilityMeter {
  id: string;
  meterNumber: string;
  utilityType: UtilityType;
  unitId?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
  multiplier: number;
  isActive: boolean;
  unit?: UtilityMeterUnit | null;
}

export interface UtilityBill {
  id: string;
  meterId: string;
  tenantId?: string | null;
  unitId?: string | null;
  utilityType: UtilityType;
  periodStart: string;
  periodEnd: string;
  consumption: number;
  rate: number;
  amountDue: number;
  amountPaid?: number | null;
  status: UtilityBillStatus;
  dueDate?: string | null;
  issuedDate?: string | null;
  paidDate?: string | null;
  meter?: { id: string; meterNumber: string } | null;
  unit?: UtilityMeterUnit | null;
}

export interface BillQuery {
  page?: number;
  limit?: number;
  utilityType?: UtilityType;
  status?: UtilityBillStatus;
}

export function useMyBills(query: BillQuery = {}) {
  return useQuery({
    queryKey: ['my-utility-bills', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.utilityType) params.set('utilityType', query.utilityType);
      if (query.status) params.set('status', query.status);
      const { data } = await api.get<ApiResponse<UtilityBill[]>>(
        `/utility-bills${params.toString() ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

export function useMyMeters(query: BillQuery = {}) {
  return useQuery({
    queryKey: ['my-utility-meters', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.utilityType) params.set('utilityType', query.utilityType);
      const { data } = await api.get<ApiResponse<UtilityMeter[]>>(
        `/utility-meters${params.toString() ? `?${params}` : ''}`,
      );
      return data.data;
    },
  });
}

export function usePayUtilityBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      paidAmount,
      reference,
    }: {
      id: string;
      paidAmount?: number;
      reference?: string;
    }) => {
      const { data } = await api.post<ApiResponse<UtilityBill>>(`/utility-bills/${id}/mark-paid`, {
        paidAmount,
        reference,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-utility-bills'] });
    },
  });
}

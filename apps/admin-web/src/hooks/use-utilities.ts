import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type UtilityType = "water" | "electricity" | "gas";

export type UtilityBillStatus =
  | "pending"
  | "paid"
  | "partially_paid"
  | "waived"
  | "disputed";

export interface UtilityMeterTenant {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface UtilityMeterUnit {
  id: string;
  unitNumber?: string | null;
}

export interface UtilityMeterProperty {
  id: string;
  name?: string | null;
  propertyCode?: string | null;
}

export interface UtilityMeter {
  id: string;
  meterNumber: string;
  utilityType: UtilityType;
  unitId?: string | null;
  propertyId?: string | null;
  tenantId?: string | null;
  multiplier: number;
  installationDate?: string | null;
  isActive: boolean;
  createdAt: string;
  unit?: UtilityMeterUnit | null;
  property?: UtilityMeterProperty | null;
  tenant?: UtilityMeterTenant | null;
  resident?: { id: string; firstName?: string | null; lastName?: string | null; email: string; name?: string } | null;
  readingsCount?: number;
  lastReading?: string | null;
}

export interface ConsumptionReading {
  id: string;
  meterId: string;
  readingDate: string;
  value: number;
  reader?: string | null;
  note?: string | null;
  createdAt: string;
  meter?: { id: string; meterNumber: string; utilityType?: UtilityType } | null;
}

export interface UtilityBillTenant {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface UtilityBillUnit {
  id: string;
  unitNumber?: string | null;
}

export interface UtilityBill {
  id: string;
  meterId: string;
  tenantId?: string | null;
  unitId?: string | null;
  utilityType: UtilityType;
  periodStart: string;
  periodEnd: string;
  previousReading?: number | null;
  currentReading?: number | null;
  consumption: number;
  rate: number;
  amountDue: number;
  amountPaid?: number | null;
  status: UtilityBillStatus;
  dueDate?: string | null;
  issuedDate?: string | null;
  paidDate?: string | null;
  createdAt: string;
  meter?: { id: string; meterNumber: string } | null;
  tenant?: UtilityBillTenant | null;
  unit?: UtilityBillUnit | null;
  resident?: { id: string; firstName?: string | null; lastName?: string | null; email: string; name?: string } | null;
}

export interface MeterQuery {
  page?: number;
  limit?: number;
  utilityType?: UtilityType;
  propertyId?: string;
  unitId?: string;
  isActive?: boolean;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface ReadingQuery {
  page?: number;
  limit?: number;
  meterId?: string;
  from?: string;
  to?: string;
}

export interface BillQuery {
  page?: number;
  limit?: number;
  meterId?: string;
  tenantId?: string;
  unitId?: string;
  utilityType?: UtilityType;
  status?: UtilityBillStatus;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

function buildParams(query: Record<string, unknown | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useMeters(query: MeterQuery = {}) {
  return useQuery({
    queryKey: ["utility-meters", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UtilityMeter[]>>(
        `/utility-meters${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as PaginatedResult<UtilityMeter>;
    },
  });
}

export function useMeter(id: string) {
  return useQuery({
    queryKey: ["utility-meter", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UtilityMeter>>(`/utility-meters/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useMeterReadings(id: string, query: ReadingQuery = {}) {
  return useQuery({
    queryKey: ["utility-meter-readings", id, query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConsumptionReading[]>>(
        `/utility-meters/${id}/readings${buildParams(query as Record<string, unknown>)}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMeter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<UtilityMeter>) => {
      const { data } = await api.post<ApiResponse<UtilityMeter>>("/utility-meters", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility-meters"] });
    },
  });
}

export function useUpdateMeter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<UtilityMeter> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<UtilityMeter>>(`/utility-meters/${id}`, payload);
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["utility-meters"] });
      queryClient.invalidateQueries({ queryKey: ["utility-meter", variables.id] });
      void result;
    },
  });
}

export function useDeleteMeter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<{ id: string }>>(`/utility-meters/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility-meters"] });
    },
  });
}

export function useReadings(query: ReadingQuery = {}) {
  return useQuery({
    queryKey: ["consumption-readings", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ConsumptionReading[]>>(
        `/consumption-readings${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as PaginatedResult<ConsumptionReading>;
    },
  });
}

export function useCreateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ConsumptionReading>) => {
      const { data } = await api.post<ApiResponse<ConsumptionReading>>(
        "/consumption-readings",
        payload
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["consumption-readings"] });
      if (result?.meterId) {
        queryClient.invalidateQueries({ queryKey: ["utility-meter-readings", result.meterId] });
        queryClient.invalidateQueries({ queryKey: ["utility-meter", result.meterId] });
      }
    },
  });
}

export function useUpdateReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ConsumptionReading> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<ConsumptionReading>>(
        `/consumption-readings/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["consumption-readings"] });
      if (result?.meterId) {
        queryClient.invalidateQueries({ queryKey: ["utility-meter-readings", result.meterId] });
        queryClient.invalidateQueries({ queryKey: ["utility-meter", result.meterId] });
      }
    },
  });
}

export function useDeleteReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<{ deleted: boolean }>>(
        `/consumption-readings/${id}`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumption-readings"] });
      queryClient.invalidateQueries({ queryKey: ["utility-meter-readings"] });
      queryClient.invalidateQueries({ queryKey: ["utility-meter"] });
    },
  });
}

export function useBulkReadings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { readings: Partial<ConsumptionReading>[] }) => {
      const { data } = await api.post<ApiResponse<ConsumptionReading[]>>(
        "/consumption-readings/bulk",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consumption-readings"] });
      queryClient.invalidateQueries({ queryKey: ["utility-meters"] });
    },
  });
}

export function useBills(query: BillQuery = {}) {
  return useQuery({
    queryKey: ["utility-bills", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UtilityBill[]>>(
        `/utility-bills${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as PaginatedResult<UtilityBill>;
    },
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ["utility-bill", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UtilityBill>>(`/utility-bills/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<UtilityBill>) => {
      const { data } = await api.post<ApiResponse<UtilityBill>>("/utility-bills", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility-bills"] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<UtilityBill> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<UtilityBill>>(`/utility-bills/${id}`, payload);
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["utility-bills"] });
      queryClient.invalidateQueries({ queryKey: ["utility-bill", variables.id] });
      void result;
    },
  });
}

export function useGenerateBills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<{
        propertyId: string;
        unitId: string;
        periodStart: string;
        periodEnd: string;
        rate: number;
        dueDate: string;
      }>
    ) => {
      const { data } = await api.post<ApiResponse<UtilityBill[]>>(
        "/utility-bills/generate",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility-bills"] });
    },
  });
}

export function useMarkBillPaid() {
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
      const { data } = await api.post<ApiResponse<UtilityBill>>(
        `/utility-bills/${id}/mark-paid`,
        { paidAmount, reference }
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["utility-bills"] });
      queryClient.invalidateQueries({ queryKey: ["utility-bill", variables.id] });
      void result;
    },
  });
}

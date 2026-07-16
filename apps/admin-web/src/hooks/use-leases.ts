import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { LeaseType, type ApiResponse, type PaginationMeta } from "@elite-realty/shared-types";

export type LeaseStatus =
  | "pending"
  | "active"
  | "expiring"
  | "expired"
  | "terminated"
  | "rto_active"
  | "rto_delinquent"
  | "rto_converted";

export interface Lease {
  id: string;
  leaseNumber?: string;
  tenantName: string;
  tenantEmail: string;
  tenantUserId?: string;
  propertyId?: string;
  propertyName?: string;
  unitLabel?: string;
  leaseType: LeaseType;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit?: number;
  penaltyPercent?: number;
  graceDays?: number;
  status: LeaseStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = "card" | "ach" | "cash" | "check" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface RentalPayment {
  id: string;
  leaseAgreementId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  period?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  type?: LeaseType;
  status?: LeaseStatus;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function transformLease(l: any): Lease {
  return {
    id: l.id,
    leaseNumber: l.leaseNumber,
    tenantName: l.tenant ? `${l.tenant.firstName ?? ""} ${l.tenant.lastName ?? ""}`.trim() || "Unknown" : "Unknown",
    tenantEmail: l.tenant?.email ?? "",
    tenantUserId: l.tenantUserId,
    propertyId: l.propertyId,
    propertyName: l.property?.name ?? l.property?.propertyCode ?? "",
    unitLabel: l.unitLabel ?? l.unit?.unitNumber ?? "",
    leaseType: l.leaseType,
    startDate: l.startDate,
    endDate: l.endDate,
    monthlyRent: Number(l.monthlyRentAmount),
    securityDeposit: l.securityDepositAmount ? Number(l.securityDepositAmount) : undefined,
    penaltyPercent: l.latePaymentPenaltyPercent ? Number(l.latePaymentPenaltyPercent) : undefined,
    graceDays: l.gracePeriodDays,
    status: l.isActive ? "active" : "expired",
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

export function useLeases(query: LeaseQuery) {
  return useQuery({
    queryKey: ["leases", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      if (query.search) params.set("search", query.search);
      if (query.type) params.set("type", query.type);
      if (query.status) params.set("status", query.status);
      const { data } = await api.get<ApiResponse<any[]>>(`/leases?${params}`);
      const transformed = data.data.map(transformLease);
      return { data: transformed, meta: data.meta } as PaginatedResult<Lease>;
    },
  });
}

export function useLease(id: string) {
  return useQuery({
    queryKey: ["lease", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(`/leases/${id}`);
      return transformLease(data.data);
    },
    enabled: !!id,
  });
}

export function toCreateLeasePayload(lease: Partial<Lease>): Record<string, unknown> {
  return {
    propertyId: lease.propertyId,
    tenantUserId: lease.tenantUserId,
    leaseType: lease.leaseType,
    startDate: lease.startDate,
    endDate: lease.endDate,
    monthlyRentAmount: Number(lease.monthlyRent),
    securityDepositAmount: lease.securityDeposit != null ? String(lease.securityDeposit) : undefined,
    latePaymentPenaltyPercent: lease.penaltyPercent != null ? String(lease.penaltyPercent) : undefined,
    gracePeriodDays: lease.graceDays,
  };
}

export function useCreateLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Lease>) => {
      const { data } = await api.post<ApiResponse<Lease>>("/leases", toCreateLeasePayload(payload));
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    },
  });
}

export function useUpdateLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Lease> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Lease>>(`/leases/${id}`, toCreateLeasePayload(payload));
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["lease", variables.id] });
      void result;
    },
  });
}

export function useTerminateLease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post<ApiResponse<Lease>>(`/leases/${id}/terminate`, { reason });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["lease", variables.id] });
    },
  });
}

export function useLeasePayments(leaseId: string) {
  return useQuery({
    queryKey: ["rental-payments", leaseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leaseId) params.set("leaseAgreementId", leaseId);
      const { data } = await api.get<ApiResponse<any[]>>(`/rental-payments?${params}`);
      return (data.data ?? []).map((p: any) => ({
        id: p.id,
        leaseAgreementId: p.leaseAgreementId,
        amount: Number(p.amountDue),
        method: p.paymentMethod || "card",
        status: p.status,
        period: p.period,
        dueDate: p.dueDate,
        paidDate: p.paymentDate,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) as RentalPayment[];
    },
    enabled: !!leaseId,
  });
}

export function useCreateRentalPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<RentalPayment>) => {
      const { data } = await api.post<ApiResponse<RentalPayment>>("/rental-payments", payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["rental-payments", result.leaseAgreementId] });
    },
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      amount,
      method,
      paidDate,
    }: {
      id: string;
      amount: number;
      method: PaymentMethod;
      paidDate?: string;
    }) => {
      const { data } = await api.post<ApiResponse<RentalPayment>>(`/rental-payments/${id}/record`, {
        amount,
        method,
        paidDate,
      });
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["rental-payments", result.leaseAgreementId] });
    },
  });
}

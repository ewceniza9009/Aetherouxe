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

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useMyLease() {
  return useQuery({
    queryKey: ["my-lease"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("tenantUserId", "me");
      params.set("limit", "10");
      const { data } = await api.get<ApiResponse<Lease[]>>(`/leases?${params}`);
      return data.data[0] ?? null;
    },
  });
}

export function useLeasePayments(leaseId: string) {
  return useQuery({
    queryKey: ["my-rental-payments", leaseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leaseId) params.set("leaseAgreementId", leaseId);
      const { data } = await api.get<ApiResponse<RentalPayment[]>>(`/rental-payments?${params}`);
      return data.data;
    },
    enabled: !!leaseId,
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
      queryClient.invalidateQueries({ queryKey: ["my-rental-payments", result.leaseAgreementId] });
      queryClient.invalidateQueries({ queryKey: ["my-lease"] });
    },
  });
}


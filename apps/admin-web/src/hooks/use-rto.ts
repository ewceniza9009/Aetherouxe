import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type RtoStatus =
  | "active"
  | "grace_period"
  | "defaulted"
  | "exercised"
  | "completed";

export type RtoLedgerType =
  | "payment_credit"
  | "forfeiture"
  | "option_fee_credit";

export interface RtoLedgerEntry {
  id: string;
  rtoContractId: string;
  transactionType: RtoLedgerType | string;
  amount: number;
  runningBalance: number;
  reference?: string | null;
  notes?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
}

export interface RtoPaymentAllocation {
  id: string;
  rentalPaymentId: string;
  rtoContractId: string;
  rentPortionAmount: number;
  equityPortionAmount: number;
  totalPaymentAmount: number;
  createdAt: string;
}

export interface RtoLeaseTenant {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface RtoLeaseProperty {
  id: string;
  propertyCode: string;
  propertyType?: string;
}

export interface RtoLeaseAgreement {
  id: string;
  monthlyRentAmount?: number;
  startDate?: string;
  endDate?: string;
  property?: RtoLeaseProperty | null;
  tenant?: RtoLeaseTenant | null;
}

export interface RtoContract {
  id: string;
  leaseAgreementId: string;
  totalContractValue: number;
  optionFeeAmount: number;
  monthlyRentPortion: number;
  monthlyEquityPortion: number;
  accumulatedEquity: number;
  targetPurchaseDate?: string | null;
  purchaseOptionPrice?: number | null;
  isOptionExercised: boolean;
  exerciseDate?: string | null;
  status: RtoStatus;
  contractDocumentUrl?: string | null;
  createdAt: string;
  leaseAgreement?: RtoLeaseAgreement | null;
  paymentAllocations?: RtoPaymentAllocation[];
  equityLedger?: RtoLedgerEntry[];
}

export interface RtoQuery {
  page?: number;
  limit?: number;
  status?: RtoStatus;
  propertyId?: string;
}

export interface CheckDefaultResult {
  contractsChecked: number;
  defaulted: string[];
  gracePeriod: string[];
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function tenantDisplayName(contract?: RtoContract | null): string {
  const t = contract?.leaseAgreement?.tenant;
  if (!t) return "Unknown tenant";
  const full = [t.firstName, t.lastName].filter(Boolean).join(" ").trim();
  return full || t.email;
}

export function propertyDisplayName(contract?: RtoContract | null): string {
  const p = contract?.leaseAgreement?.property;
  return p?.propertyCode ?? "Unassigned property";
}

export function useRtoContracts(query: RtoQuery) {
  return useQuery({
    queryKey: ["rto-contracts", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.status) params.set("status", query.status);
      if (query.propertyId) params.set("propertyId", query.propertyId);
      const { data } = await api.get<ApiResponse<RtoContract[]>>(`/rto-contracts?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<RtoContract>;
    },
  });
}

export function useRtoContract(id: string) {
  return useQuery({
    queryKey: ["rto-contract", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RtoContract>>(`/rto-contracts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useRtoLedger(contractId: string) {
  return useQuery({
    queryKey: ["rto-ledger", contractId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RtoLedgerEntry[]>>(
        `/rto-contracts/${contractId}/ledger`
      );
      return data.data;
    },
    enabled: !!contractId,
  });
}

export function useCheckDefault() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<CheckDefaultResult>>(
        `/rto-contracts/${id}/check-default`,
        {}
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rto-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["rto-contract"] });
    },
  });
}

export function useExerciseOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { data } = await api.post<ApiResponse<RtoContract>>(
        `/rto-contracts/${id}/exercise`,
        { userId }
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["rto-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["rto-contract", result.id] });
      queryClient.invalidateQueries({ queryKey: ["rto-ledger", result.id] });
    },
  });
}

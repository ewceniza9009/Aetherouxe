import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

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

export function useMyRto() {
  return useQuery({
    queryKey: ["my-rto"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "active");
      params.set("limit", "1");
      const { data } = await api.get<ApiResponse<RtoContract[]>>(`/rto-contracts?${params}`);
      const first = data.data?.[0];
      if (!first) return null;
      const { data: detail } = await api.get<ApiResponse<RtoContract>>(
        `/rto-contracts/${first.id}`
      );
      return detail.data ?? null;
    },
  });
}

export function useRtoLedger(contractId: string) {
  return useQuery({
    queryKey: ["my-rto-ledger", contractId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RtoLedgerEntry[]>>(
        `/rto-contracts/${contractId}/ledger`
      );
      return data.data;
    },
    enabled: !!contractId,
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
      queryClient.invalidateQueries({ queryKey: ["my-rto"] });
      queryClient.invalidateQueries({ queryKey: ["my-rto-ledger", result.id] });
    },
  });
}

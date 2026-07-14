import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export interface AmortizationRow {
  period: number;
  beginningBalance: number;
  payment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
}

export interface MortgageScenario {
  id: string;
  leaseAgreementId: string;
  propertyId?: string;
  homePrice?: number;
  downPaymentPercent: number;
  downPaymentAmount?: number;
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPaid?: number;
  amortizationSchedule: AmortizationRow[];
  createdAt: string;
  updatedAt?: string;
}

export interface MortgageScenarioQuery {
  page?: number;
  limit?: number;
  leaseAgreementId?: string;
}

export type GenerateScenarioInput = {
  leaseAgreementId: string;
  downPaymentPercent: number;
  interestRate: number;
  termMonths: number;
  homePrice?: number;
};

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useMortgageScenarios(query: MortgageScenarioQuery) {
  return useQuery({
    queryKey: ["mortgage-scenarios", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.leaseAgreementId) params.set("leaseAgreementId", query.leaseAgreementId);
      const { data } = await api.get<ApiResponse<MortgageScenario[]>>(`/mortgage/scenarios?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<MortgageScenario>;
    },
    enabled: !!query.leaseAgreementId,
  });
}

export function useMortgageScenario(id: string) {
  return useQuery({
    queryKey: ["mortgage-scenario", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MortgageScenario>>(`/mortgage/scenarios/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useGenerateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GenerateScenarioInput) => {
      const { data } = await api.post<ApiResponse<MortgageScenario>>("/mortgage/scenarios/generate", payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["mortgage-scenarios", { leaseAgreementId: result.leaseAgreementId }] });
      queryClient.invalidateQueries({ queryKey: ["mortgage-scenario", result.id] });
    },
  });
}

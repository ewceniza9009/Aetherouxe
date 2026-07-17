import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export interface AmortizationRow {
  period: number;
  periodDate?: string;
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

function mapAmortizationRows(rows: any[]): AmortizationRow[] {
  return (rows ?? []).map((r) => ({
    period: r.periodNumber ?? r.period ?? 0,
    periodDate: r.periodDate,
    beginningBalance: Number(r.beginningBalance) || 0,
    payment: Number(r.monthlyPayment ?? r.payment) || 0,
    principal: Number(r.principalPayment ?? r.principal) || 0,
    interest: Number(r.interestPayment ?? r.interest) || 0,
    endingBalance: Number(r.endingBalance) || 0,
    cumulativeInterest: Number(r.cumulativeInterestPaid ?? r.cumulativeInterest) || 0,
  }));
}

export function useMortgageScenarios(query: MortgageScenarioQuery) {
  return useQuery({
    queryKey: ["mortgage-scenarios", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.leaseAgreementId) params.set("leaseAgreementId", query.leaseAgreementId);
      const { data } = await api.get<ApiResponse<any[]>>(`/mortgage/scenarios?${params}`);
      const transformed = (data.data ?? []).map((s: any) => ({
        id: s.id,
        leaseAgreementId: s.leaseAgreementId,
        propertyId: s.propertyId,
        homePrice: s.propertyValueAtGeneration ? Number(s.propertyValueAtGeneration) : undefined,
        downPaymentPercent: Number(s.downPaymentPercent),
        downPaymentAmount: s.downPaymentAmount ? Number(s.downPaymentAmount) : undefined,
        loanAmount: Number(s.loanAmount),
        interestRate: Number(s.interestRatePercent),
        termMonths: s.loanTermMonths,
        monthlyPayment: Number(s.monthlyAmortization),
        totalInterest: Number(s.totalInterestPayable),
        totalPaid: s.totalPaid ? Number(s.totalPaid) : undefined,
        amortizationSchedule: mapAmortizationRows(s.amortizationSchedule),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      return { data: transformed, meta: data.meta } as PaginatedResult<MortgageScenario>;
    },
    enabled: !!query.leaseAgreementId,
  });
}

export function useMortgageScenario(id: string) {
  return useQuery({
    queryKey: ["mortgage-scenario", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(`/mortgage/scenarios/${id}`);
      const s = data.data;
      return {
        id: s.id,
        leaseAgreementId: s.leaseAgreementId,
        propertyId: s.propertyId,
        homePrice: s.propertyValueAtGeneration ? Number(s.propertyValueAtGeneration) : undefined,
        downPaymentPercent: Number(s.downPaymentPercent),
        downPaymentAmount: s.downPaymentAmount ? Number(s.downPaymentAmount) : undefined,
        loanAmount: Number(s.loanAmount),
        interestRate: Number(s.interestRatePercent),
        termMonths: s.loanTermMonths,
        monthlyPayment: Number(s.monthlyAmortization),
        totalInterest: Number(s.totalInterestPayable),
        totalPaid: s.totalPaid ? Number(s.totalPaid) : undefined,
        amortizationSchedule: mapAmortizationRows(s.amortizationSchedule),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      } as MortgageScenario;
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

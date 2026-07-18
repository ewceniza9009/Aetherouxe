import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export const SCHEME_TYPES = [
  { value: "standard_rental", label: "Standard Rental", color: "text-blue-400" },
  { value: "spot_cash", label: "Spot Cash", color: "text-emerald-400" },
  { value: "installment", label: "Installment", color: "text-amber-400" },
  { value: "mortgage_assisted", label: "Mortgage Assisted", color: "text-purple-400" },
  { value: "rent_to_own", label: "Rent-to-Own", color: "text-rose-400" },
] as const;

export type SchemeTypeValue = typeof SCHEME_TYPES[number]["value"];

export interface Scheme {
  id: string;
  code: string;
  name?: string;
  schemeType: SchemeTypeValue;
  remarks?: string;
  projectId?: string;
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  securityDepositPercent?: number;
  penaltyPercent?: number;
  graceDays?: number;

  discountPercent?: number;

  dpNumberOfPayments?: number;
  dpNumberOfDaysFromDp?: number;
  dpAmount?: number;
  dpRemarks?: string;

  eqNumberOfPayments?: number;
  eqNumberOfDaysFromDp?: number;
  eqAmount?: number;
  eqPaymentPercentage?: number;
  eqDownpaymentPercentage?: number;
  eqMonthlyAmortPercentage?: number;
  eqDiscountPercentage?: number;
  eqPaymentOrderNumber?: number;
  eqRemarks?: string;

  blNumberOfPayments?: number;
  blNumberOfDaysFromDp?: number;
  blAmount?: number;
  blPaymentPercentage?: number;
  blMiscPercentage?: number;
  blIsChangeOrder?: boolean;
  blIncludeDpAmort?: boolean;
  blRemarks?: string;

  mortgageDownPaymentPercent?: number;
  interestRatePercent?: number;
  loanTermMonths?: number;

  optionFeePercent?: number;
  equityAccumulationPercent?: number;
  targetPurchaseYears?: number;

  agentCommissionPercentage?: number;
  companyCommissionPercentage?: number;
}

export interface SchemeQuery {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export function useSchemes(query: SchemeQuery = {}) {
  return useQuery({
    queryKey: ["schemes", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.type) params.set("type", query.type);
      if (query.search) params.set("search", query.search);
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      const { data } = await api.get<ApiResponse<Scheme[]>>(`/schemes?${params}`);
      return { data: data.data ?? [], meta: data.meta } as {
        data: Scheme[];
        meta: PaginationMeta;
      };
    },
  });
}

export function useScheme(id: string) {
  return useQuery({
    queryKey: ["scheme", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Scheme>>(`/schemes/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Scheme>) => {
      const { data } = await api.post<ApiResponse<Scheme>>("/schemes", payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schemes"] }),
  });
}

export function useUpdateScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Scheme> & { id: string }) => {
      const { data } = await api.put<ApiResponse<Scheme>>(`/schemes/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["schemes"] });
      qc.invalidateQueries({ queryKey: ["scheme", vars.id] });
    },
  });
}

export function useDeleteScheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/schemes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schemes"] }),
  });
}

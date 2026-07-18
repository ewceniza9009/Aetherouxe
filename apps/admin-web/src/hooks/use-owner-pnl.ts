import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type PnlStatus = "draft" | "generated" | "sent" | "paid" | "archived";

export type PnlLineItemType =
  | "rental_income"
  | "maintenance"
  | "utilities"
  | "management_fee"
  | "tax"
  | "insurance"
  | "other";

export interface PnlLineItem {
  id?: string;
  type: PnlLineItemType;
  label: string;
  amount: number;
}

export interface OwnerPnlStatement {
  id: string;
  ownerId: string;
  ownerName?: string | null;
  propertyId?: string | null;
  propertyName?: string | null;
  periodStart: string;
  periodEnd: string;
  grossRentalIncome: number;
  totalExpenses: number;
  managementFee: number;
  netIncome: number;
  managementFeeRate?: number | null;
  yieldPct?: number | null;
  status: PnlStatus;
  lineItems?: PnlLineItem[];
  createdAt: string;
  owner?: {
    firstName?: string | null;
    lastName?: string | null;
  };
  property?: {
    propertyCode: string;
  };
}

export interface PnlQuery {
  page?: number;
  limit?: number;
  ownerId?: string;
  propertyId?: string;
  status?: PnlStatus;
  sort?: string;
  order?: "asc" | "desc";
}

interface Paginated<T> {
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

export function usePnlStatements(query: PnlQuery = {}) {
  return useQuery({
    queryKey: ["owner-pnl", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OwnerPnlStatement[]>>(
        `/owner-pnl${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<OwnerPnlStatement>;
    },
  });
}

export function usePnlStatement(id: string) {
  return useQuery({
    queryKey: ["owner-pnl-statement", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<OwnerPnlStatement>>(
        `/owner-pnl/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useGeneratePnl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ownerId: string;
      propertyId?: string;
      periodStart: string;
      periodEnd: string;
      managementFeeRate?: number;
    }) => {
      const { data } = await api.post<ApiResponse<OwnerPnlStatement>>(
        "/owner-pnl/generate",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pnl"] });
    },
  });
}

export function useCreatePnl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<OwnerPnlStatement>) => {
      const { data } = await api.post<ApiResponse<OwnerPnlStatement>>(
        "/owner-pnl",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-pnl"] });
    },
  });
}

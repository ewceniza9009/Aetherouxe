import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export interface Budget {
  id: string;
  projectId: string;
  name: string;
  version: number;
  totalPlanned: number;
  totalActual: number;
  status: "draft" | "approved" | "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface BudgetHealth {
  id: string;
  budgetId: string;
  healthScore: "green" | "yellow" | "red";
  variance: number;
  variancePercentage: number;
  totalPlanned: number;
  totalActual: number;
  plannedVsActual: { category: string; planned: number; actual: number }[];
}

export interface LineItem {
  id: string;
  budgetId: string;
  category: string;
  subcategory: string;
  description?: string;
  plannedAmount: number;
  actualAmount: number;
  vendor?: string;
  status: "pending" | "ordered" | "received" | "invoiced" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface BudgetQuery {
  page?: number;
  limit?: number;
  projectId?: string;
  sort?: string;
  order?: "asc" | "desc";
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useBudgets(query: BudgetQuery) {
  return useQuery({
    queryKey: ["budgets", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.projectId) params.set("projectId", query.projectId);
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      const { data } = await api.get<ApiResponse<Budget[]>>(`/budgets?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<Budget>;
    },
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ["budget", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Budget>>(`/budgets/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useBudgetHealth(id: string) {
  return useQuery({
    queryKey: ["budget-health", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetHealth>>(`/budgets/${id}/health`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Budget>) => {
      const { data } = await api.post<ApiResponse<Budget>>("/budgets", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Budget> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Budget>>(`/budgets/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["budget", result.id] });
    },
  });
}

export function useCreateLineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<LineItem>) => {
      const { data } = await api.post<ApiResponse<LineItem>>("/line-items", payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["budget-health", result.budgetId] });
    },
  });
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<LineItem> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<LineItem>>(`/line-items/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["budget-health", result.budgetId] });
    },
  });
}

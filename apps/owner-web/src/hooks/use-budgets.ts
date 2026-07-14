import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export interface BudgetHealthItem {
  lineItemId: string;
  category: string;
  subcategory?: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  percentConsumed: number;
  isOver90Percent: boolean;
  health: "green" | "yellow" | "red";
  vendorName?: string;
}

export interface BudgetHealth {
  budgetId: string;
  budgetName: string;
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  overallHealth: "green" | "yellow" | "red";
  items: BudgetHealthItem[];
}

export function useBudgetHealth(budgetId: string) {
  return useQuery({
    queryKey: ["owner-budget-health-detail", budgetId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetHealth>>(`/budgets/${budgetId}/health`);
      return data.data;
    },
    enabled: !!budgetId,
  });
}

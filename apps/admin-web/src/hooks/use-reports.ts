import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export interface PortfolioKpis {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  activeLeases: number;
  monthlyRecurringRevenue: number;
  totalReceivable: number;
  openServiceRequests: number;
  activeRtoContracts: number;
  totalEquityAccumulated: number;
}

export interface RevenuePoint {
  month: string;
  label: string;
  revenue: number;
}

export function usePortfolioKpis() {
  return useQuery({
    queryKey: ["portfolio-kpis"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PortfolioKpis>>(
        "/reports/portfolio-kpis"
      );
      return data.data;
    },
  });
}

export function useRevenueTrend(months = 6) {
  return useQuery({
    queryKey: ["revenue-trend", months],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RevenuePoint[]>>(
        `/reports/revenue-trend?months=${months}`
      );
      return (data.data ?? []) as RevenuePoint[];
    },
  });
}


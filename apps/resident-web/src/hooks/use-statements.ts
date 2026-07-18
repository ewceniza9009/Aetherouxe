import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@elite-realty/shared-ui/hooks";
import type { ApiResponse } from "@elite-realty/shared-types";

export type StatementStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Statement {
  id: string;
  tenantId?: string | null;
  ownerName: string;
  propertyName?: string | null;
  period: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  billedAmount: number;
  paidAmount: number;
  closingBalance: number;
  status: StatementStatus;
  generatedAt?: string | null;
  createdAt: string;
}

export function useMyStatements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-statements", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set("tenantId", user.id);
      const { data } = await api.get<ApiResponse<Statement[]>>(
        `/statements?${params.toString()}`
      );
      return (data.data ?? []) as Statement[];
    },
    enabled: !!user?.id,
  });
}

export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "—";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


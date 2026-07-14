import type { UtilityType, UtilityBillStatus } from "@/hooks/use-utilities";

export const utilityTypeMeta: Record<
  UtilityType,
  { label: string; className: string; icon: string }
> = {
  water: {
    label: "Water",
    className: "bg-blue-100 text-blue-800 border-transparent",
    icon: "Droplets",
  },
  electricity: {
    label: "Electricity",
    className: "bg-yellow-100 text-yellow-800 border-transparent",
    icon: "Zap",
  },
  gas: {
    label: "Gas",
    className: "bg-orange-100 text-orange-800 border-transparent",
    icon: "Flame",
  },
};

export const billStatusMeta: Record<
  UtilityBillStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 border-transparent" },
  paid: { label: "Paid", className: "bg-green-100 text-green-800 border-transparent" },
  partially_paid: {
    label: "Partially Paid",
    className: "bg-blue-100 text-blue-800 border-transparent",
  },
  waived: { label: "Waived", className: "bg-slate-100 text-slate-700 border-transparent" },
  disputed: { label: "Disputed", className: "bg-red-100 text-red-800 border-transparent" },
};

export function utilityTypeLabel(type?: UtilityType | string): string {
  if (!type) return "—";
  return utilityTypeMeta[type as UtilityType]?.label ?? String(type);
}

export function billStatusLabel(status?: UtilityBillStatus | string): string {
  if (!status) return "—";
  return billStatusMeta[status as UtilityBillStatus]?.label ?? String(status);
}

export function money(n: number | null | undefined): string {
  return `$${Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

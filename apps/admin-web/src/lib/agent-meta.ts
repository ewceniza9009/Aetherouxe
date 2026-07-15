import type { AgentTierValue, LicenseStatus, AgentStatus } from "@/hooks/use-agents";
import type { AgentTransactionStatus, CommissionReleaseType } from "@/hooks/use-commissions";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export const TIER_LABELS: Record<AgentTierValue, string> = {
  junior: "Junior",
  senior: "Senior",
  lead: "Lead",
  director: "Director",
};

export function tierBadgeVariant(tier: AgentTierValue): BadgeVariant {
  switch (tier) {
    case "director":
      return "default";
    case "lead":
      return "success";
    case "senior":
      return "secondary";
    default:
      return "outline";
  }
}

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  compliant: "Compliant",
  expired: "Expired",
  pending: "Pending",
  suspended: "Suspended",
};

export function licenseStatusVariant(status: LicenseStatus): BadgeVariant {
  switch (status) {
    case "compliant":
      return "success";
    case "expired":
      return "destructive";
    case "pending":
      return "warning";
    default:
      return "destructive";
  }
}

export function licenseDotColor(status: LicenseStatus): string {
  switch (status) {
    case "compliant":
      return "bg-green-500";
    case "expired":
      return "bg-red-500";
    case "pending":
      return "bg-yellow-500";
    default:
      return "bg-red-600";
  }
}

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  probation: "Probation",
};

export function agentStatusVariant(status: AgentStatus): BadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "secondary";
    default:
      return "warning";
  }
}

export const TRANSACTION_STATUS_LABELS: Record<AgentTransactionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function transactionStatusVariant(
  status: AgentTransactionStatus
): BadgeVariant {
  switch (status) {
    case "paid":
      return "success";
    case "approved":
      return "default";
    case "pending":
      return "warning";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  sale: "Sale",
  lease: "Lease",
  rental: "Rental",
  referral: "Referral",
  renewal: "Renewal",
};

export const RELEASE_TYPE_LABELS: Record<CommissionReleaseType, string> = {
  partial: "Partial",
  full: "Full",
  advance: "Advance",
  bonus: "Bonus",
  adjustment: "Adjustment",
};

export { formatCurrency } from "./settings-store";

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

export function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

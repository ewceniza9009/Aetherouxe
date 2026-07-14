import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { ApiResponse } from "@elite-realty/shared-types";

export type ReminderType =
  | "rent_due"
  | "overdue"
  | "late_fee"
  | "notice"
  | "statement";

export type ReminderChannel = "email" | "sms" | "push" | "letter";

export type ReminderStatus = "pending" | "sent" | "failed" | "cancelled";

export interface PaymentReminder {
  id: string;
  tenantId?: string | null;
  recipientName: string;
  recipientEmail?: string | null;
  type: ReminderType;
  channel: ReminderChannel;
  scheduledAt?: string | null;
  sentAt?: string | null;
  status: ReminderStatus;
  message?: string | null;
  createdAt: string;
}

export function useMyReminders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-reminders", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set("tenantId", user.id);
      const { data } = await api.get<ApiResponse<PaymentReminder[]>>(
        `/payment-reminders?${params.toString()}`
      );
      return (data.data ?? []) as PaymentReminder[];
    },
    enabled: !!user?.id,
  });
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  rent_due: "Rent Due",
  overdue: "Overdue",
  late_fee: "Late Fee",
  notice: "Notice",
  statement: "Statement",
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
  cancelled: "Cancelled",
};

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

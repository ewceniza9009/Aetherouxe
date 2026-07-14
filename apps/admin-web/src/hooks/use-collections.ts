import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

/* ----------------------------- Types ----------------------------- */

export interface ArAgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  total: number;
  count: number;
}

export interface ArAgingByTenant {
  tenantId: string;
  tenantName: string;
  outstanding: number;
  worstBucket: string;
}

export interface ArAgingByProperty {
  propertyId?: string;
  propertyName: string;
  outstanding: number;
}

export interface ArAgingReport {
  totalReceivable: number;
  buckets: ArAgingBucket[];
  byTenant: ArAgingByTenant[];
  byProperty: ArAgingByProperty[];
}

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

export interface StatementPayload {
  tenantId: string;
  ownerName: string;
  propertyName?: string;
  period: string;
  periodStart?: string;
  periodEnd?: string;
  billedAmount: number;
  paidAmount?: number;
  closingBalance?: number;
}

export type CollectionCaseStatus =
  | "open"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "closed";

export type CollectionCasePriority = "low" | "medium" | "high" | "critical";

export interface CollectionCase {
  id: string;
  caseNumber: string;
  tenantId?: string | null;
  tenantName: string;
  leaseId?: string | null;
  leaseNumber?: string | null;
  priority: CollectionCasePriority;
  status: CollectionCaseStatus;
  outstandingAmount: number;
  assignedTo?: string | null;
  assignedToName?: string | null;
  nextActionDate?: string | null;
  openedAt?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface CollectionCaseNote {
  id: string;
  collectionCaseId: string;
  note: string;
  authorName?: string | null;
  createdAt: string;
}

export interface CollectionActivity {
  id: string;
  collectionCaseId: string;
  type: string;
  date?: string | null;
  outcome?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CollectionCaseDetail extends CollectionCase {
  notes: CollectionCaseNote[];
  activities: CollectionActivity[];
}

export interface CollectionCasePayload {
  tenantId: string;
  tenantName: string;
  leaseId?: string;
  priority: CollectionCasePriority;
  outstandingAmount: number;
  assignedTo?: string;
  nextActionDate?: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/* --------------------------- Helpers --------------------------- */

function buildParams(query?: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/* ----------------------------- AR Aging ----------------------------- */

export function useArAging(params?: { propertyId?: string }) {
  return useQuery({
    queryKey: ["ar-aging", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ArAgingReport>>(
        `/ar-aging/report${buildParams(params)}`
      );
      return data.data;
    },
  });
}

/* --------------------------- Payment Reminders --------------------------- */

export function usePaymentReminders(query?: {
  status?: ReminderStatus;
  type?: ReminderType;
  tenantId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["payment-reminders", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaymentReminder[]>>(
        `/payment-reminders${buildParams(query)}`
      );
      return data.data ?? [];
    },
  });
}

export function useGenerateReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ generated: number }>>(
        `/payment-reminders/generate-overdue`,
        {}
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-reminders"] });
    },
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<PaymentReminder>) => {
      const { data } = await api.post<ApiResponse<PaymentReminder>>(
        `/payment-reminders`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-reminders"] });
    },
  });
}

export function useMarkReminderSent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<PaymentReminder>>(
        `/payment-reminders/${id}/mark-sent`,
        {}
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-reminders"] });
    },
  });
}

/* ----------------------------- Statements ----------------------------- */

export function useStatements(query?: {
  tenantId?: string;
  status?: StatementStatus;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["statements", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Statement[]>>(
        `/statements${buildParams(query)}`
      );
      return (data.data ?? []) as Statement[];
    },
  });
}

export function useCreateStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StatementPayload) => {
      const { data } = await api.post<ApiResponse<Statement>>(
        `/statements`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statements"] });
    },
  });
}

export function useGenerateStatement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { tenantId: string; period: string }) => {
      const { data } = await api.post<ApiResponse<Statement>>(
        `/statements/generate`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statements"] });
    },
  });
}

/* --------------------------- Collection Cases --------------------------- */

export function useCollectionCases(query?: {
  status?: CollectionCaseStatus;
  priority?: CollectionCasePriority;
}) {
  return useQuery({
    queryKey: ["collection-cases", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CollectionCase[]>>(
        `/collection-cases${buildParams(query)}`
      );
      return (data.data ?? []) as CollectionCase[];
    },
  });
}

export function useCollectionCase(id: string) {
  return useQuery({
    queryKey: ["collection-case", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CollectionCaseDetail>>(
        `/collection-cases/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useOpenOverdueCases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ opened: number }>>(
        `/collection-cases/open-overdue`,
        {}
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-cases"] });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<CollectionCase> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<CollectionCase>>(
        `/collection-cases/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collection-cases"] });
      queryClient.invalidateQueries({
        queryKey: ["collection-case", variables.id],
      });
    },
  });
}

export function useAddCaseNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      note,
    }: {
      caseId: string;
      note: string;
    }) => {
      const { data } = await api.post<ApiResponse<CollectionCaseNote>>(
        `/collection-cases/${caseId}/notes`,
        { note }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collection-case", variables.caseId],
      });
    },
  });
}

export function useAddCaseActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caseId,
      type,
      date,
      outcome,
      notes,
    }: {
      caseId: string;
      type: string;
      date?: string;
      outcome?: string;
      notes?: string;
    }) => {
      const { data } = await api.post<ApiResponse<CollectionActivity>>(
        `/collection-cases/${caseId}/activities`,
        { type, date, outcome, notes }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collection-case", variables.caseId],
      });
    },
  });
}

export function useCollectionActivities(caseId: string) {
  return useQuery({
    queryKey: ["collection-activities", caseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CollectionActivity[]>>(
        `/collection-activities?collectionCaseId=${caseId}`
      );
      return data.data ?? [];
    },
    enabled: !!caseId,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CollectionCasePayload) => {
      const { data } = await api.post<ApiResponse<CollectionCase>>(
        `/collection-cases`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-cases"] });
    },
  });
}

/* --------------------------- Shared Display Maps --------------------------- */

export const AR_BUCKETS: { label: string; tone: string; bar: string; soft: string }[] = [
  { label: "0-30", tone: "text-green-600", bar: "bg-green-500", soft: "bg-green-50 border-green-200" },
  { label: "31-60", tone: "text-lime-600", bar: "bg-lime-500", soft: "bg-lime-50 border-lime-200" },
  { label: "61-90", tone: "text-yellow-600", bar: "bg-yellow-500", soft: "bg-yellow-50 border-yellow-200" },
  { label: "91-120", tone: "text-orange-600", bar: "bg-orange-500", soft: "bg-orange-50 border-orange-200" },
  { label: "120+", tone: "text-red-600", bar: "bg-red-500", soft: "bg-red-50 border-red-200" },
];

export function bucketTone(label: string) {
  return (
    AR_BUCKETS.find((b) => b.label === label) ?? {
      tone: "text-muted-foreground",
      bar: "bg-muted-foreground",
      soft: "bg-muted/30 border-muted",
    }
  );
}

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  rent_due: "Rent Due",
  overdue: "Overdue",
  late_fee: "Late Fee",
  notice: "Notice",
  statement: "Statement",
};

export const REMINDER_STATUS_VARIANT: Record<
  ReminderStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  pending: "warning",
  sent: "success",
  failed: "destructive",
  cancelled: "secondary",
};

export const STATEMENT_STATUS_VARIANT: Record<
  StatementStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  draft: "outline",
  sent: "secondary",
  paid: "success",
  overdue: "destructive",
  cancelled: "default",
};

export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const CASE_STATUS_VARIANT: Record<
  CollectionCaseStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  open: "outline",
  in_progress: "warning",
  escalated: "destructive",
  resolved: "success",
  closed: "secondary",
};

export const CASE_STATUS_LABELS: Record<CollectionCaseStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

export const CASE_PRIORITY_VARIANT: Record<
  CollectionCasePriority,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  low: "outline",
  medium: "secondary",
  high: "warning",
  critical: "destructive",
};

export const CASE_PRIORITY_LABELS: Record<CollectionCasePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null) return "—";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

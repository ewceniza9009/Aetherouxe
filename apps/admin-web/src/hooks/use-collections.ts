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

export interface ArAgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceType: string;
  tenantName: string;
  propertyCode: string | null;
  amount: number;
  paid: number;
  outstanding: number;
  dueDate: string;
  daysOverdue: number;
  bucket: string;
  status: string;
}

export interface ArAgingReport {
  totalReceivable: number;
  buckets: ArAgingBucket[];
  byTenant: ArAgingByTenant[];
  byProperty: ArAgingByProperty[];
  invoices: ArAgingInvoice[];
}

export type ReminderType = "pre_due" | "post_due" | "final_notice";

export type ReminderChannel = "email" | "sms" | "portal" | "letter";

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

export type StatementStatus = "draft" | "sent" | "disputed";

export interface StatementUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface StatementTenant {
  name?: string | null;
}

export interface Statement {
  id: string;
  tenantId?: string | null;
  ownerId?: string | null;
  propertyId?: string | null;
  owner?: StatementUser | null;
  tenant?: StatementTenant | null;
  property?: unknown | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  openingBalance?: string | number | null;
  totalBilled?: string | number | null;
  totalPaid?: string | number | null;
  closingBalance?: string | number | null;
  status: StatementStatus;
  pdfUrl?: string | null;
  generatedAt?: string | null;
  createdAt: string;
}

export interface StatementPayload {
  tenantId?: string;
  ownerId: string;
  propertyId?: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  totalBilled: number;
  totalPaid: number;
  status?: StatementStatus;
  pdfUrl?: string;
}

export type CollectionCaseStatus =
  | "open"
  | "in_progress"
  | "escalated"
  | "resolved"
  | "written_off";

export type CollectionCasePriority = "low" | "medium" | "high" | "critical";

export interface CollectionCaseTenant {
  id?: string;
  name?: string | null;
}

export interface CollectionCaseAssignedTo {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface CollectionCaseLease {
  id: string;
  leaseNumber?: string | null;
  leaseType?: string | null;
  schemeType?: string | null;
  unitLabel?: string | null;
  monthlyRentAmount?: string | number | null;
  tenant?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  property?: {
    id?: string;
    propertyCode?: string | null;
  } | null;
}

export interface CollectionCase {
  id: string;
  caseNumber: string;
  tenantId?: string | null;
  tenant?: CollectionCaseTenant | null;
  leaseId?: string | null;
  lease?: CollectionCaseLease | null;
  priority: CollectionCasePriority;
  status: CollectionCaseStatus;
  totalOutstanding?: string | number | null;
  assignedToId?: string | null;
  assignedTo?: CollectionCaseAssignedTo | null;
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
  tenantId?: string;
  leaseId?: string;
  priority: CollectionCasePriority;
  totalOutstanding: number;
  assignedToId?: string;
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

const AR_BUCKET_LABELS: Record<string, string> = {
  Current: "Current (0-30)",
  Bucket31_60: "31-60 days",
  Bucket61_90: "61-90 days",
  Bucket91_120: "91-120 days",
  Bucket120Plus: "120+ days",
};

const AR_BUCKET_ORDER = [
  "Bucket120Plus",
  "Bucket91_120",
  "Bucket61_90",
  "Bucket31_60",
  "Current",
];

function worstBucketOf(buckets: Record<string, number> | undefined): string {
  if (!buckets) return AR_BUCKET_LABELS.Current;
  for (const key of AR_BUCKET_ORDER) {
    if ((buckets[key] ?? 0) > 0) return AR_BUCKET_LABELS[key];
  }
  return AR_BUCKET_LABELS.Current;
}

export function useArAging(params?: { propertyId?: string }) {
  return useQuery({
    queryKey: ["ar-aging", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(
        `/ar-aging/report${buildParams(params)}`
      );
      const raw = data.data ?? {};
      const report: ArAgingReport = {
        totalReceivable: Number(raw.totalReceivable ?? 0),
        buckets: (raw.buckets ?? []).map((b: any) => ({
          label: AR_BUCKET_LABELS[b.name] ?? b.name,
          minDays: 0,
          maxDays: null,
          total: Number(b.total ?? 0),
          count: Number(b.count ?? 0),
        })),
        byTenant: (raw.byUser ?? []).map((u: any) => ({
          tenantId: u.userId,
          tenantName: u.userName,
          outstanding: Number(u.totalOutstanding ?? 0),
          worstBucket: worstBucketOf(u.buckets),
        })),
        byProperty: (raw.byProperty ?? []).map((p: { propertyId?: string; propertyCode?: string; propertyName?: string; totalOutstanding?: number }) => ({
          propertyId: p.propertyId,
          propertyName: p.propertyCode ?? p.propertyName ?? "—",
          outstanding: Number(p.totalOutstanding ?? 0),
        })),
        invoices: (raw.invoices ?? []).map((i: { invoiceId: string; invoiceNumber?: string; invoiceType: string; userName?: string; propertyCode?: string | null; amount: number; paid: number; outstanding: number; dueDate: string; daysOverdue: number; bucket?: string; status?: string }) => ({
          invoiceId: i.invoiceId,
          invoiceNumber: i.invoiceNumber ?? i.invoiceId,
          invoiceType: i.invoiceType,
          tenantName: i.userName ?? "—",
          propertyCode: i.propertyCode ?? null,
          amount: Number(i.amount ?? 0),
          paid: Number(i.paid ?? 0),
          outstanding: Number(i.outstanding ?? 0),
          dueDate: i.dueDate,
          daysOverdue: Number(i.daysOverdue ?? 0),
          bucket: i.bucket ? AR_BUCKET_LABELS[i.bucket] ?? i.bucket : "—",
          status: i.status,
        })),
      };
      return report;
    },
  });
}

/* --------------------------- Payment Reminders --------------------------- */

export function usePaymentReminders(query?: {
  status?: ReminderStatus;
  type?: ReminderType;
  tenantId?: string;
  limit?: number;
  page?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["payment-reminders", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaymentReminder[]>>(
        `/payment-reminders${buildParams(query)}`
      );
      return { data: data.data ?? [], meta: data.meta } as {
        data: PaymentReminder[];
        meta: PaginationMeta;
      };
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
  search?: string;
  tenantId?: string;
  status?: StatementStatus;
  limit?: number;
  page?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["statements", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Statement[]>>(
        `/statements${buildParams(query)}`
      );
      return { data: (data.data ?? []) as Statement[], meta: data.meta } as {
        data: Statement[];
        meta: PaginationMeta;
      };
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
    mutationFn: async (payload: { tenantId?: string; period?: string }) => {
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
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["collection-cases", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CollectionCase[]>>(
        `/collection-cases${buildParams(query)}`
      );
      return { data: (data.data ?? []) as CollectionCase[], meta: data.meta } as PaginatedResult<CollectionCase>;
    },
  });
}

function mapActivity(a: any): CollectionActivity {
  return {
    id: a.id,
    collectionCaseId: a.collectionCaseId,
    type: a.activityType ?? a.type ?? "activity",
    date: a.performedAt ?? a.date ?? a.createdAt ?? null,
    outcome: a.outcome ?? null,
    notes: a.notes ?? null,
    createdAt: a.createdAt,
  };
}

export function useCollectionCase(id: string) {
  return useQuery({
    queryKey: ["collection-case", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CollectionCaseDetail>>(
        `/collection-cases/${id}`
      );
      const detail = data.data;
      if (detail?.activities) {
        detail.activities = detail.activities.map(mapActivity);
      }
      return detail;
    },
    enabled: !!id,
  });
}

export function useOpenOverdueCases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get<ApiResponse<{ count: number }>>(
        `/collection-cases/open-overdue`
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
      nextActionDate,
    }: {
      caseId: string;
      type: string;
      date?: string;
      outcome?: string;
      notes?: string;
      nextActionDate?: string;
    }) => {
      const { data } = await api.post<ApiResponse<CollectionActivity>>(
        `/collection-activities`,
        {
          collectionCaseId: caseId,
          activityType: type,
          performedAt: date,
          outcome,
          notes,
          nextActionDate,
        }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collection-case", variables.caseId],
      });
      queryClient.invalidateQueries({ queryKey: ["collection-activities"] });
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

export function useDeleteCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<{ deleted: boolean }>>(
        `/collection-cases/${id}`
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
  pre_due: "Pre-Due",
  post_due: "Post-Due",
  final_notice: "Final Notice",
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
  disputed: "destructive",
};

export const STATEMENT_STATUS_LABELS: Record<StatementStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  disputed: "Disputed",
};

export const CASE_STATUS_VARIANT: Record<
  CollectionCaseStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  open: "outline",
  in_progress: "warning",
  escalated: "destructive",
  resolved: "success",
  written_off: "secondary",
};

export const CASE_STATUS_LABELS: Record<CollectionCaseStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  escalated: "Escalated",
  resolved: "Resolved",
  written_off: "Written Off",
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

export const LEASE_TYPE_LABELS: Record<string, string> = {
  standard_rental: "Rent",
  corporate_lease: "Corporate Rent",
  short_term: "Short-term Rent",
  rent_to_own: "Rent-to-Own",
};

export function personName(
  lease?: CollectionCaseLease | null,
): string {
  const t = lease?.tenant;
  if (!t) return "—";
  const full = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
  return full || t.email || "—";
}

export { formatCurrency } from "../lib/settings-store";

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


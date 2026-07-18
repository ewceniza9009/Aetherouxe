import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  FolderOpen,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  useCollectionCases,
  useCreateCase,
  useUpdateCase,
  useDeleteCase,
  useOpenOverdueCases,
  CASE_STATUS_VARIANT,
  CASE_STATUS_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_PRIORITY_LABELS,
  LEASE_TYPE_LABELS,
  personName,
  type CollectionCaseStatus,
  type CollectionCasePriority,
  formatCurrency,
  formatDate,
} from "@/hooks/use-collections";
import { useLeases, useLeasePayments } from "@/hooks/use-leases";

const STATUS_OPTIONS: { value: CollectionCaseStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
  { value: "written_off", label: "Written Off" },
];

export default function CollectionCasesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [form, setForm] = useState({
    leaseId: "",
    totalOutstanding: "",
    priority: "medium" as CollectionCasePriority,
    nextActionDate: "",
  });
  const [amountEdited, setAmountEdited] = useState(false);

  const { data, isLoading, isError } = useCollectionCases();
  const { data: leasesResult } = useLeases({ limit: 200 });
  const leases = leasesResult?.data ?? [];
  const { data: leasePayments, isLoading: loadingPayments } = useLeasePayments(
    form.leaseId
  );

  const overduePayments = useMemo(
    () =>
      (leasePayments ?? []).filter((p) => {
        const remaining = Number(p.amountDue ?? 0) - Number(p.amountPaid ?? 0);
        return remaining > 0.005 && p.status !== "paid";
      }),
    [leasePayments]
  );

  const computedOutstanding = useMemo(
    () =>
      overduePayments.reduce(
        (sum, p) => sum + (Number(p.amountDue ?? 0) - Number(p.amountPaid ?? 0)),
        0
      ),
    [overduePayments]
  );
  const createCase = useCreateCase();
  const updateCase = useUpdateCase();
  const deleteCase = useDeleteCase();
  const openOverdue = useOpenOverdueCases();

  const cases = useMemo(() => {
    const all = data ?? [];
    return all.filter((c) => {
      const statusOk =
        statusFilter === "all" || c.status === (statusFilter as CollectionCaseStatus);
      const priorityOk =
        priorityFilter === "all" ||
        c.priority === (priorityFilter as CollectionCasePriority);
      return statusOk && priorityOk;
    });
  }, [data, statusFilter, priorityFilter]);

  const allSelected = cases.length > 0 && cases.every((c) => selected.has(c.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(cases.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const outstanding =
      amountEdited || !form.leaseId
        ? Number(form.totalOutstanding) || 0
        : computedOutstanding;
    await createCase.mutateAsync({
      leaseId: form.leaseId || undefined,
      totalOutstanding: outstanding,
      priority: form.priority,
      nextActionDate: form.nextActionDate || undefined,
    });
    setCreateOpen(false);
    setForm({ leaseId: "", totalOutstanding: "", priority: "medium", nextActionDate: "" });
    setAmountEdited(false);
  }

  async function handleBulkStatus() {
    if (!bulkStatus) return;
    await Promise.all(
      Array.from(selected).map((id) =>
        updateCase.mutateAsync({ id, status: bulkStatus as CollectionCaseStatus })
      )
    );
    setSelected(new Set());
    setBulkStatus("");
  }

  async function handleBulkDelete() {
    if (
      !window.confirm(
        `Delete ${selected.size} case(s)? This removes their notes and activities.`
      )
    )
      return;
    await Promise.all(Array.from(selected).map((id) => deleteCase.mutateAsync(id)));
    setSelected(new Set());
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this collection case?")) return;
    await deleteCase.mutateAsync(id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Collection Cases</h1>
          <p className="text-muted-foreground">Track and manage delinquent accounts</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => openOverdue.mutate()}
            disabled={openOverdue.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Open Overdue
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Case
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/collections" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Collections
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-accent" /> Cases
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selected.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-3">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Set status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkStatus}
                disabled={!bulkStatus || updateCase.isPending}
              >
                Apply Status
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleteCase.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          )}
          {isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              Failed to load collection cases.
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No collection cases found.</p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        className="cursor-pointer"
                        checked={allSelected}
                        onCheckedChange={() => toggleAll()}
                      />
                    </TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Person (Renter/Buyer)</TableHead>
                    <TableHead>Property / Unit</TableHead>
                    <TableHead>Owed For</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: `/collections/cases/${c.id}` })}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          className="cursor-pointer"
                          checked={selected.has(c.id)}
                          onCheckedChange={() => toggleOne(c.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {c.caseNumber ? `#${c.caseNumber}` : `#${c.id.slice(0, 8).toUpperCase()}`}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{personName(c.lease)}</div>
                        {c.tenant?.name && (
                          <div className="text-xs text-muted-foreground">{c.tenant.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{c.lease?.property?.propertyCode ?? "—"}</div>
                        {c.lease?.unitLabel && (
                          <div className="text-xs text-muted-foreground">
                            Unit {c.lease.unitLabel}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.lease?.leaseType ? (
                          <Badge variant="outline">
                            {LEASE_TYPE_LABELS[c.lease.leaseType] ?? c.lease.leaseType}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Rent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={CASE_PRIORITY_VARIANT[c.priority]}>
                          {CASE_PRIORITY_LABELS[c.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={CASE_STATUS_VARIANT[c.status]}>
                          {CASE_STATUS_LABELS[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">
                        {formatCurrency(Number(c.totalOutstanding ?? 0))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.assignedTo
                          ? `${c.assignedTo.firstName ?? ""} ${c.assignedTo.lastName ?? ""}`.trim() || "—"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.nextActionDate)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Collection Case</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Lease</Label>
              <Select
                value={form.leaseId}
                onValueChange={(v) => {
                  setAmountEdited(false);
                  setForm((f) => ({ ...f, leaseId: v, totalOutstanding: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.propertyName || "Lease"}
                      {l.unitLabel ? ` · Unit ${l.unitLabel}` : ""} — {l.tenantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outstanding">Total Outstanding</Label>
              <CurrencyInput
                value={
                  amountEdited || !form.leaseId
                    ? form.totalOutstanding
                    : computedOutstanding
                      ? String(computedOutstanding.toFixed(2))
                      : ""
                }
                onChange={(v) => {
                  setAmountEdited(true);
                  setForm((f) => ({ ...f, totalOutstanding: v }));
                }}
                placeholder={form.leaseId ? "0.00" : "Select a lease first"}
              />
              {form.leaseId && (
                <p className="text-xs text-muted-foreground">
                  {loadingPayments ? (
                    "Calculating outstanding balance…"
                  ) : overduePayments.length > 0 ? (
                    <>
                      Auto-calculated from {overduePayments.length} unpaid charge
                      {overduePayments.length > 1 ? "s" : ""}:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(computedOutstanding)}
                      </span>
                      . You can override if needed.
                    </>
                  ) : (
                    "No unpaid charges found for this lease — enter the amount manually."
                  )}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as CollectionCasePriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextAction">Next Action Date</Label>
                <Input
                  id="nextAction"
                  type="date"
                  value={form.nextActionDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nextActionDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCase.isPending}>
                {createCase.isPending ? "Creating..." : "Create Case"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

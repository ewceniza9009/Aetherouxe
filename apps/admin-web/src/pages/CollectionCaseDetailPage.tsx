import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import { Separator } from "@elite-realty/shared-ui/components/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import {
  ArrowLeft,
  FolderOpen,
  Loader2,
  Plus,
  CalendarClock,
  Building2,
  User,
  Home,
  Receipt,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import {
  useCollectionCase,
  useAddCaseNote,
  useAddCaseActivity,
  useUpdateCase,
  CASE_STATUS_VARIANT,
  CASE_STATUS_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_PRIORITY_LABELS,
  LEASE_TYPE_LABELS,
  personName,
  formatCurrency,
  formatDate,
  type CollectionCaseStatus,
} from "@/hooks/use-collections";
import { useLeasePayments, useRecordPayment, type PaymentMethod } from "@/hooks/use-leases";
import { useUsers } from "@/hooks/use-users";

export default function CollectionCaseDetailPage() {
  const { id } = useParams({ from: "/protected/collections/cases/$id" });
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCollectionCase(id);

  const [note, setNote] = useState("");
  const addNote = useAddCaseNote();
  const submitNote = async () => {
    if (!note.trim()) return;
    await addNote.mutateAsync({ caseId: id, note: note.trim() });
    setNote("");
  };

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState("call");
  const [activityOutcome, setActivityOutcome] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityNotes, setActivityNotes] = useState("");
  const addActivity = useAddCaseActivity();
  const submitActivity = async () => {
    await addActivity.mutateAsync({
      caseId: id,
      type: activityType,
      outcome: activityOutcome || undefined,
      date: activityDate || undefined,
      notes: activityNotes || undefined,
    });
    setActivityOpen(false);
    setActivityOutcome("");
    setActivityDate("");
    setActivityNotes("");
  };

  const leaseId = data?.lease?.id ?? data?.leaseId ?? "";
  const { data: payments } = useLeasePayments(leaseId);
  const outstandingPayments = (payments ?? []).filter(
    (p) => Number(p.amountDue ?? p.amount) - Number(p.amountPaid ?? 0) > 0
  );
  const recordPayment = useRecordPayment();
  const updateCase = useUpdateCase();

  const { data: staffResult } = useUsers({ limit: 200 });
  const staff = (staffResult?.data ?? []).filter((u) =>
    ["super_admin", "admin", "property_manager", "finance"].includes(u.userType)
  );
  const staffName = (u: { firstName?: string | null; lastName?: string | null; email: string }) =>
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;

  const [payOpen, setPayOpen] = useState(false);
  const [payPaymentId, setPayPaymentId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("bank_transfer");
  const [payDate, setPayDate] = useState("");

  const selectedPayment = outstandingPayments.find((p) => p.id === payPaymentId);
  const selectedRemaining = selectedPayment
    ? Number(selectedPayment.amountDue ?? selectedPayment.amount) -
      Number(selectedPayment.amountPaid ?? 0)
    : 0;

  const openPayDialog = () => {
    const first = outstandingPayments[0];
    setPayPaymentId(first?.id ?? "");
    setPayAmount(
      first
        ? String(
            Number(first.amountDue ?? first.amount) - Number(first.amountPaid ?? 0)
          )
        : ""
    );
    setPayMethod("bank_transfer");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayOpen(true);
  };

  const submitPayment = async () => {
    if (!payPaymentId || !payAmount) return;
    await recordPayment.mutateAsync({
      id: payPaymentId,
      amount: Number(payAmount),
      method: payMethod,
      paidDate: payDate || undefined,
    });
    setPayOpen(false);
  };

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col ">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate({ to: "/collections/cases" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cases
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Unable to load this collection case.
          </CardContent>
        </Card>
      </div>
    );
  }

  const notes = data.notes ?? [];
  const activities = data.activities ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              {data.caseNumber ?? `#${data.id.slice(0, 8).toUpperCase()}`}
            </h1>
            <Badge variant={CASE_PRIORITY_VARIANT[data.priority]}>
              {CASE_PRIORITY_LABELS[data.priority]}
            </Badge>
            <Select
              value={data.status}
              onValueChange={(v) =>
                updateCase.mutate({ id: data.id, status: v as CollectionCaseStatus })
              }
            >
              <SelectTrigger className="h-7 w-36">
                <Badge variant={CASE_STATUS_VARIANT[data.status]}>
                  {CASE_STATUS_LABELS[data.status]}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="written_off">Written Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" /> {personName(data.lease)}
              {data.lease?.tenant?.phone ? ` · ${data.lease.tenant.phone}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              {data.lease?.property?.propertyCode ?? "—"}
              {data.lease?.unitLabel ? ` · Unit ${data.lease.unitLabel}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <Receipt className="h-4 w-4" /> Owed for{" "}
              {data.lease?.leaseType
                ? LEASE_TYPE_LABELS[data.lease.leaseType] ?? data.lease.leaseType
                : "Rent"}
            </span>
            {data.tenant?.name && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" /> {data.tenant.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openPayDialog} disabled={outstandingPayments.length === 0}>
            <Wallet className="mr-2 h-4 w-4" /> Record Payment
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/collections/cases" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cases
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Outstanding" value={formatCurrency(Number(data.totalOutstanding ?? 0))} tone="text-rose-700" />
        <SummaryCard
          title="Opened"
          value={formatDate(data.openedAt ?? data.createdAt)}
        />
        <SummaryCard title="Last Activity" value={formatDate(data.lastActivityAt)} />
        <SummaryCard
          title="Next Action"
          value={formatDate(data.nextActionDate)}
          icon={<CalendarClock className="h-4 w-4 text-orange-600" />}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-accent" /> Assignment &amp; Next Action
          </CardTitle>
          <CardDescription>
            Assign a staff owner and schedule the next follow-up for this case.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Assigned Staff</Label>
            <Select
              value={data.assignedToId ?? "unassigned"}
              onValueChange={(v) =>
                updateCase.mutate({
                  id: data.id,
                  assignedToId: v === "unassigned" ? null : v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staff.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {staffName(u)}
                    <span className="ml-1 text-xs capitalize text-muted-foreground">
                      · {u.userType.replace(/_/g, " ")}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.assignedTo && (
              <p className="text-xs text-muted-foreground">
                Currently:{" "}
                {`${data.assignedTo.firstName ?? ""} ${data.assignedTo.lastName ?? ""}`.trim() ||
                  "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextaction">Next Action Date</Label>
            <Input
              id="nextaction"
              type="date"
              value={data.nextActionDate ? data.nextActionDate.slice(0, 10) : ""}
              onChange={(e) =>
                updateCase.mutate({
                  id: data.id,
                  nextActionDate: e.target.value || undefined,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">
            Activities {activities.length > 0 && `(${activities.length})`}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes {notes.length > 0 && `(${notes.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-accent" /> Activity Timeline
                </CardTitle>
                <Button size="sm" onClick={() => setActivityOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No activities recorded yet.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-4 pl-4">
                  <div className="absolute left-1 top-1 bottom-1 w-px bg-border" />
                  {activities.map((a) => (
                    <div key={a.id} className="relative">
                      <span className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{a.type?.replace(/_/g, " ") ?? "activity"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(a.date ?? a.createdAt)}
                          </span>
                        </div>
                        {a.outcome && (
                          <p className="mt-1 text-sm">
                            <span className="text-muted-foreground">Outcome: </span>
                            {a.outcome}
                          </p>
                        )}
                        {a.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">{a.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-accent" /> Case Notes
              </CardTitle>
              <CardDescription>Internal notes visible to staff only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNote();
                  }}
                />
                <Button
                  onClick={submitNote}
                  disabled={addNote.isPending || !note.trim()}
                >
                  {addNote.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
              <Separator />
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No notes yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3">
                      <p className="text-sm">{n.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.authorName ?? "Staff"} · {formatDate(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>Log a collection touchpoint for this case.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atype">Type</Label>
              <Input
                id="atype"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                placeholder="call, email, letter, visit..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adate">Date</Label>
              <Input
                id="adate"
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aoutcome">Outcome</Label>
              <Input
                id="aoutcome"
                value={activityOutcome}
                onChange={(e) => setActivityOutcome(e.target.value)}
                placeholder="Promise to pay, no answer..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anotes">Notes</Label>
              <Input
                id="anotes"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitActivity} disabled={addActivity.isPending}>
              {addActivity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Apply a payment to an outstanding charge on this lease.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Outstanding Charge</Label>
              <Select
                value={payPaymentId}
                onValueChange={(v) => {
                  setPayPaymentId(v);
                  const p = outstandingPayments.find((x) => x.id === v);
                  if (p)
                    setPayAmount(
                      String(
                        Number(p.amountDue ?? p.amount) - Number(p.amountPaid ?? 0)
                      )
                    );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select charge" />
                </SelectTrigger>
                <SelectContent>
                  {outstandingPayments.map((p) => {
                    const rem =
                      Number(p.amountDue ?? p.amount) - Number(p.amountPaid ?? 0);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.period ?? formatDate(p.dueDate)} · {formatCurrency(rem)} due
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedPayment && (
              <p className="text-xs text-muted-foreground">
                Remaining on this charge: {formatCurrency(selectedRemaining)}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="payamt">Amount</Label>
              <Input
                id="payamt"
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={payMethod}
                  onValueChange={(v) => setPayMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paydate">Paid Date</Label>
                <Input
                  id="paydate"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitPayment}
              disabled={recordPayment.isPending || !payPaymentId || !payAmount}
            >
              {recordPayment.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ?? <FolderOpen className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}




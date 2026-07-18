import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScrollText,
  Plus,
  PlayCircle,
  CheckCircle2,
  Ban,
  Pencil,
  Trash2,
  FileText,
  Landmark,
  CircleDollarSign,
} from "lucide-react";
import {
  useTitleTransfers,
  useCreateTitleTransfer,
  useUpdateTitleTransfer,
  useCompleteTitleTransfer,
  useDeleteTitleTransfer,
  titleTransferStatusLabels,
  titleTransferBasisLabels,
  type TitleTransfer,
  type TitleTransferStatus,
  type TitleTransferBasis,
  type TitleTransferInput,
} from "@/hooks/use-titles";
import { useProperties } from "@/hooks/use-properties";
import { useUsers } from "@/hooks/use-users";
import { useUnits } from "@/hooks/use-units";
import { formatCurrency } from "@/lib/settings-store";
import { ListPager } from "@/components/ListPager";

const statusVariant: Record<TitleTransferStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  pending: "secondary",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
};

const STAGES: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function partyName(p?: { firstName?: string | null; lastName?: string | null; email?: string } | null): string {
  if (!p) return "—";
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return name || p.email || "—";
}

function money(v?: string | number | null): string {
  if (v == null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return formatCurrency(n);
}

interface FormState {
  propertyId: string;
  unitId: string;
  buyerUserId: string;
  previousOwnerUserId: string;
  basis: TitleTransferBasis;
  status: TitleTransferStatus;
  titleNumber: string;
  contractValue: string;
  amountSettled: string;
  transferFeeAmount: string;
  notes: string;
}

const emptyForm: FormState = {
  propertyId: "",
  unitId: "",
  buyerUserId: "",
  previousOwnerUserId: "",
  basis: "manual",
  status: "pending",
  titleNumber: "",
  contractValue: "",
  amountSettled: "",
  transferFeeAmount: "",
  notes: "",
};

export default function TitleTransfersPage() {
  const [tab, setTab] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TitleTransfer | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string>("requestedDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const LIMIT = 20;

  const { data, isLoading, isError } = useTitleTransfers(
    tab !== "all"
      ? { status: tab as TitleTransferStatus, page, limit: LIMIT, sort, order }
      : { page, limit: LIMIT, sort, order }
  );
  const { data: propertiesResult } = useProperties({ limit: 300 });
  const { data: usersResult } = useUsers({ limit: 300, isActive: true });
  const { data: unitsResult } = useUnits({ limit: 300, propertyId: form.propertyId });

  const transfers = data?.data ?? [];
  const properties = propertiesResult?.data ?? [];
  const users = usersResult?.data ?? [];
  const units = unitsResult?.data ?? [];

  const create = useCreateTitleTransfer();
  const update = useUpdateTitleTransfer();
  const complete = useCompleteTitleTransfer();
  const remove = useDeleteTitleTransfer();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: transfers.length, pending: 0, in_progress: 0, completed: 0, cancelled: 0 };
    for (const t of transfers) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [transfers]);

  const totalValue = useMemo(
    () => transfers.filter((t) => t.status !== "cancelled").reduce((s, t) => s + (Number(t.contractValue) || 0), 0),
    [transfers]
  );
  const settledValue = useMemo(
    () => transfers.filter((t) => t.status === "completed").reduce((s, t) => s + (Number(t.amountSettled) || Number(t.contractValue) || 0), 0),
    [transfers]
  );

  function openCreate() {
    setForm(emptyForm);
    setCreateOpen(true);
  }

  function openEdit(t: TitleTransfer) {
    setForm({
      propertyId: t.propertyId,
      unitId: t.unitId ?? "",
      buyerUserId: t.buyerUserId,
      previousOwnerUserId: t.previousOwnerUserId ?? "",
      basis: t.basis,
      status: t.status,
      titleNumber: t.titleNumber ?? "",
      contractValue: t.contractValue ? String(t.contractValue) : "",
      amountSettled: t.amountSettled ? String(t.amountSettled) : "",
      transferFeeAmount: t.transferFeeAmount ? String(t.transferFeeAmount) : "",
      notes: t.notes ?? "",
    });
    setEditTarget(t);
  }

  function toInput(f: FormState): TitleTransferInput {
    return {
      propertyId: f.propertyId || undefined,
      unitId: f.unitId || undefined,
      buyerUserId: f.buyerUserId || undefined,
      previousOwnerUserId: f.previousOwnerUserId || undefined,
      basis: f.basis,
      status: f.status,
      titleNumber: f.titleNumber || undefined,
      contractValue: f.contractValue ? Number(f.contractValue) : undefined,
      amountSettled: f.amountSettled ? Number(f.amountSettled) : undefined,
      transferFeeAmount: f.transferFeeAmount ? Number(f.transferFeeAmount) : undefined,
      notes: f.notes || undefined,
    };
  }

  function handleCreate() {
    if (!form.propertyId || !form.buyerUserId) return;
    create.mutate(toInput(form), {
      onSuccess: () => {
        setCreateOpen(false);
        setForm(emptyForm);
      },
    });
  }

  function handleUpdate() {
    if (!editTarget) return;
    update.mutate({ id: editTarget.id, ...toInput(form) }, {
      onSuccess: () => setEditTarget(null),
    });
  }

  function handleStart(t: TitleTransfer) {
    update.mutate({ id: t.id, status: "in_progress" });
  }

  function handleComplete(t: TitleTransfer) {
    complete.mutate(t.id);
  }

  function handleCancel(t: TitleTransfer) {
    update.mutate({ id: t.id, status: "cancelled" });
  }

  function handleDelete(t: TitleTransfer) {
    remove.mutate(t.id);
  }

  const pending = transfers.filter((t) => t.status === "pending").length;
  const inProgress = transfers.filter((t) => t.status === "in_progress").length;
  const completed = transfers.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif gold-text">Title Transfers</h1>
          <p className="text-muted-foreground">
            Manage ownership handover from developer / previous owner to the buyer
          </p>
        </div>
        <Button onClick={openCreate} className="gold-gradient text-black">
          <Plus className="mr-2 h-4 w-4" /> New Transfer
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard icon={<FileText className="h-5 w-5 text-primary" />} label="Pipeline Total" value={String(transfers.length)} hint={`${pending} pending · ${inProgress} active`} />
        <SummaryCard icon={<PlayCircle className="h-5 w-5 text-amber-400" />} label="In Progress" value={String(inProgress)} hint="Being processed" />
        <SummaryCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />} label="Completed" value={String(completed)} hint="Titles handed over" />
        <SummaryCard icon={<Landmark className="h-5 w-5 text-primary" />} label="Contract Value" value={money(totalValue)} hint={`${money(settledValue)} settled`} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" /> Transfer Register
              </CardTitle>
              <CardDescription>Track each title from request through handover</CardDescription>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                {STAGES.map((s) => (
                  <TabsTrigger key={s.value} value={s.value}>
                    {s.label}
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] tabular-nums">
                      {counts[s.value] ?? 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-12 text-center text-destructive">
              <p className="font-semibold">Failed to load title transfers</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center min-h-[400px]">
              <ScrollText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No title transfers in this stage</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a transfer to begin tracking ownership handover.
              </p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => { setSort("propertyId"); setOrder(order === "asc" ? "desc" : "asc"); setPage(1); }}
                  >
                    Property {sort === "propertyId" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Basis</TableHead>
                  <TableHead>Title No.</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => { setSort("contractValue"); setOrder(order === "asc" ? "desc" : "asc"); setPage(1); }}
                  >
                    Contract Value {sort === "contractValue" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Settled</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => { setSort("status"); setOrder(order === "asc" ? "desc" : "asc"); setPage(1); }}
                  >
                    Status {sort === "status" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => { setSort("requestedDate"); setOrder(order === "asc" ? "desc" : "asc"); setPage(1); }}
                  >
                    Requested {sort === "requestedDate" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs">
                        {t.property?.propertyCode ?? "—"}
                        {t.unit?.unitNumber ? ` / ${t.unit.unitNumber}` : ""}
                        <div className="text-[11px] text-muted-foreground font-sans">
                          {t.property?.project?.name ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{partyName(t.buyer)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{titleTransferBasisLabels[t.basis]}</Badge>
                      </TableCell>
                      <TableCell>{t.titleNumber ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{money(t.contractValue)}</TableCell>
                      <TableCell className="tabular-nums">{money(t.amountSettled ?? t.contractValue)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[t.status]}>
                          {titleTransferStatusLabels[t.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(t.requestedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {t.status === "pending" && (
                            <Button size="icon" variant="ghost" title="Start processing" onClick={() => handleStart(t)}>
                              <PlayCircle className="h-4 w-4 text-amber-400" />
                            </Button>
                          )}
                          {t.status !== "completed" && t.status !== "cancelled" && (
                            <Button size="icon" variant="ghost" title="Complete handover" onClick={() => handleComplete(t)}>
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          {t.status !== "cancelled" && t.status !== "completed" && (
                            <Button size="icon" variant="ghost" title="Cancel transfer" onClick={() => handleCancel(t)}>
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title="Delete" onClick={() => handleDelete(t)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <ListPager meta={data?.meta} page={page} onPageChange={setPage} itemLabel="transfers" />

      <TransferDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New Title Transfer"
        form={form}
        setForm={setForm}
        properties={properties}
        users={users}
        units={units}
        onSubmit={handleCreate}
        submitting={create.isPending}
      />

      <TransferDialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        title="Edit Title Transfer"
        form={form}
        setForm={setForm}
        properties={properties}
        users={users}
        units={units}
        onSubmit={handleUpdate}
        submitting={update.isPending}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="hover:border-primary/30 transition-all duration-300">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums gold-text">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  properties: { id: string; code: string; name: string; projectName?: string }[];
  users: { id: string; firstName?: string | null; lastName?: string | null; email: string; userType: string }[];
  units: { id: string; unitNumber: string }[];
  onSubmit: () => void;
  submitting: boolean;
}

function TransferDialog({
  open,
  onOpenChange,
  title,
  form,
  setForm,
  properties,
  users,
  units,
  onSubmit,
  submitting,
}: TransferDialogProps) {
  const basisOptions = Object.keys(titleTransferBasisLabels) as TitleTransferBasis[];
  const statusOptions = Object.keys(titleTransferStatusLabels) as TitleTransferStatus[];
  const userLabel = (u: { firstName?: string | null; lastName?: string | null; email: string }) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Property</Label>
              <Select value={form.propertyId} onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v, unitId: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit (optional)</Label>
              <Select value={form.unitId} onValueChange={(v) => setForm((f) => ({ ...f, unitId: v }))} disabled={!form.propertyId}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Basis</Label>
              <Select value={form.basis} onValueChange={(v) => setForm((f) => ({ ...f, basis: v as TitleTransferBasis }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {basisOptions.map((b) => (
                    <SelectItem key={b} value={b}>{titleTransferBasisLabels[b]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Buyer</Label>
              <Select value={form.buyerUserId} onValueChange={(v) => setForm((f) => ({ ...f, buyerUserId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select buyer" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{userLabel(u)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Previous Owner (optional)</Label>
              <Select value={form.previousOwnerUserId} onValueChange={(v) => setForm((f) => ({ ...f, previousOwnerUserId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select previous owner" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{userLabel(u)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TitleTransferStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{titleTransferStatusLabels[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title Number</Label>
              <Input value={form.titleNumber} onChange={(e) => setForm((f) => ({ ...f, titleNumber: e.target.value }))} placeholder="e.g. T-123456" />
            </div>

            <div className="space-y-2">
              <Label>Contract Value</Label>
              <CurrencyInput value={form.contractValue} onChange={(v) => setForm((f) => ({ ...f, contractValue: v }))} />
            </div>

            <div className="space-y-2">
              <Label>Amount Settled</Label>
              <CurrencyInput value={form.amountSettled} onChange={(v) => setForm((f) => ({ ...f, amountSettled: v }))} />
            </div>

            <div className="space-y-2">
              <Label>Transfer Fee</Label>
              <CurrencyInput value={form.transferFeeAmount} onChange={(v) => setForm((f) => ({ ...f, transferFeeAmount: v }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Handover remarks, document references, etc." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="gold-gradient text-black" onClick={onSubmit} disabled={submitting}>
              {submitting ? "Saving…" : "Save Transfer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

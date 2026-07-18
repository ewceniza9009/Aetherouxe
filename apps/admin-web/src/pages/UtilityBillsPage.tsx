import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Receipt, AlertCircle, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import {
  useBills,
  useMeters,
  useCreateBill,
  useGenerateBills,
  useMarkBillPaid,
  type UtilityBill,
  type UtilityBillStatus,
  type UtilityType,
} from "@/hooks/use-utilities";
import { useProperties } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { utilityTypeMeta, billStatusMeta, money, formatDate } from "@/lib/utility-meta";
import { ListPager } from "@/components/ListPager";

function tenantUnitLabel(bill: UtilityBill): string {
  const tenant = bill.resident
    ? [bill.resident.firstName, bill.resident.lastName].filter(Boolean).join(" ") || bill.resident.email
    : null;
  const unit = bill.unit?.unitNumber;
  if (tenant && unit) return `${tenant} · ${unit}`;
  return tenant || unit || "—";
}

export default function UtilityBillsPage() {
  const [status, setStatus] = useState<string>("all");
  const [utilityType, setUtilityType] = useState<string>("all");
  const [tenantId, setTenantId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<string>("issuedDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const LIMIT = 20;

  useEffect(() => { setPage(1); }, [status, utilityType, tenantId, from, to, sort, order]);

  const { data, isLoading, isError, refetch } = useBills({
    status: status !== "all" ? (status as UtilityBillStatus) : undefined,
    utilityType: utilityType !== "all" ? (utilityType as UtilityType) : undefined,
    tenantId: tenantId || undefined,
    from: from || undefined,
    to: to || undefined,
    sort,
    order,
    page,
    limit: LIMIT,
  });

  const { data: metersData } = useMeters({ limit: 500 });
  const meters = metersData?.data ?? [];
  const { data: propertiesData } = useProperties({ limit: 200 });
  const properties = propertiesData?.data ?? [];

  const bills = data?.data ?? [];
  const totalDue = useMemo(
    () => bills.filter((b) => b.status !== "paid" && b.status !== "waived").reduce((s, b) => s + Number(b.amountDue ?? 0), 0),
    [bills]
  );
  const unpaidCount = bills.filter((b) => b.status !== "paid" && b.status !== "waived").length;

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Utility Bills</h1>
          <p className="text-muted-foreground">Generate and track water, electricity, and gas bills</p>
        </div>
        <div className="flex gap-2">
          <NewBillDialog meters={meters} />
          <GenerateBillsDialog properties={properties} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Outstanding Bills</CardTitle>
            <Receipt className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{unpaidCount}</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Total Outstanding Amount</CardTitle>
            <Receipt className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gold-text">{money(totalDue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-accent" /> Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 sm:items-center mb-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={utilityType} onValueChange={setUtilityType}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Utility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Utilities</SelectItem>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Tenant ID"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full sm:w-40"
            />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-40" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-40" />
            <Button
              variant="outline"
              onClick={() => {
                setStatus("all");
                setUtilityType("all");
                setTenantId("");
                setFrom("");
                setTo("");
              }}
            >
              Reset
            </Button>
          </div>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load utility bills.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No utility bills found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meter</TableHead>
                  <TableHead>Tenant / Unit</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Consumption</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => { setSort("amount"); setOrder(order === "asc" ? "desc" : "asc"); }}
                  >
                    Amount Due {sort === "amount" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => { setSort("status"); setOrder(order === "asc" ? "desc" : "asc"); }}
                  >
                    Status {sort === "status" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => { setSort("dueDate"); setOrder(order === "asc" ? "desc" : "asc"); }}
                  >
                    Due {sort === "dueDate" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-sm">{b.meter?.meterNumber ?? "—"}</TableCell>
                    <TableCell className="text-sm">{tenantUnitLabel(b)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.consumption}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(b.rate)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{money(b.amountDue)}</TableCell>
                    <TableCell>
                      <Badge className={billStatusMeta[b.status].className}>{billStatusMeta[b.status].label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(b.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      {b.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle2 className="h-4 w-4" /> Paid
                        </span>
                      ) : (
                        <MarkPaidButton bill={b} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ListPager meta={data?.meta} page={page} onPageChange={setPage} itemLabel="bills" />
    </div>
  );
}

function NewBillDialog({ meters }: { meters: { id: string; meterNumber: string; utilityType: UtilityType }[] }) {
  const createBill = useCreateBill();
  const [open, setOpen] = useState(false);
  const [meterId, setMeterId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [previousReading, setPreviousReading] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [rate, setRate] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState("");

  const reset = () => {
    setMeterId("");
    setPeriodStart("");
    setPeriodEnd("");
    setPreviousReading("");
    setCurrentReading("");
    setRate("");
    setAmountDue("");
    setDueDate("");
  };

  const submit = async () => {
    const prev = previousReading ? parseFloat(previousReading) : undefined;
    const curr = currentReading ? parseFloat(currentReading) : undefined;
    const consumption = prev != null && curr != null ? curr - prev : undefined;
    const rateVal = rate ? parseFloat(rate) : 0;
    await createBill.mutateAsync({
      meterId,
      periodStart,
      periodEnd,
      previousReading: prev,
      currentReading: curr,
      consumption: consumption ?? 0,
      rate: rateVal,
      amountDue: amountDue ? parseFloat(amountDue) : (consumption ?? 0) * rateVal,
      dueDate: dueDate || undefined,
      status: "pending",
    });
    setOpen(false);
    reset();
  };

  const canSubmit = meterId && periodStart && periodEnd;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> New Bill
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Utility Bill</DialogTitle>
          <DialogDescription>Create a bill from a meter and reading period.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meter">Meter</Label>
            <Select value={meterId} onValueChange={setMeterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select meter" />
              </SelectTrigger>
              <SelectContent>
                {meters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.meterNumber} · {m.utilityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start">Period Start</Label>
              <Input id="start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Period End</Label>
              <Input id="end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prev">Previous Reading</Label>
              <Input id="prev" type="number" step="0.01" value={previousReading} onChange={(e) => setPreviousReading(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="curr">Current Reading</Label>
              <Input id="curr" type="number" step="0.01" value={currentReading} onChange={(e) => setCurrentReading(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (per unit)</Label>
              <Input id="rate" type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Due (optional)</Label>
              <Input id="amount" type="number" step="0.01" value={amountDue} onChange={(e) => setAmountDue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due Date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || createBill.isPending}>
            {createBill.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateBillsDialog({
  properties,
}: {
  properties: { id: string; name: string; propertyCode?: string | null }[];
}) {
  const generate = useGenerateBills();
  const [open, setOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [rate, setRate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: unitsData } = useUnits({ propertyId: propertyId || undefined, limit: 200 });
  const units = unitsData?.data ?? [];

  const reset = () => {
    setPropertyId("");
    setUnitId("");
    setPeriodStart("");
    setPeriodEnd("");
    setRate("");
    setDueDate("");
  };

  const submit = async () => {
    await generate.mutateAsync({
      propertyId: propertyId || undefined,
      unitId: unitId || undefined,
      periodStart,
      periodEnd,
      rate: parseFloat(rate) || 0,
      dueDate,
    });
    setOpen(false);
    reset();
  };

  const canSubmit = periodStart && periodEnd && rate !== "";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" /> Generate Bills for Period
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Bills for Period</DialogTitle>
          <DialogDescription>
            Generate bills for every active meter in a property or unit for the selected period.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyCode || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={!propertyId}>
                <SelectTrigger>
                  <SelectValue placeholder={propertyId ? "Select unit" : "Pick property first"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstart">Period Start</Label>
              <Input id="gstart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gend">Period End</Label>
              <Input id="gend" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grate">Rate (per unit)</Label>
              <Input id="grate" type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gdue">Due Date</Label>
              <Input id="gdue" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || generate.isPending}>
            {generate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidButton({ bill }: { bill: UtilityBill }) {
  const markPaid = useMarkBillPaid();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(bill.amountDue ?? ""));
  const [reference, setReference] = useState("");

  const submit = async () => {
    await markPaid.mutateAsync({
      id: bill.id,
      paidAmount: amount ? parseFloat(amount) : undefined,
      reference: reference || undefined,
    });
    setOpen(false);
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <CheckCircle2 className="mr-1 h-4 w-4" /> Mark Paid
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Bill Paid</DialogTitle>
            <DialogDescription>
              Confirm payment for meter {bill.meter?.meterNumber ?? ""} · {money(bill.amountDue)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount</Label>
              <Input id="paidAmount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Payment reference" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={markPaid.isPending}>
              {markPaid.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirm Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Droplets,
  Zap,
  Flame,
  Receipt,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Gauge,
} from "lucide-react";
import {
  useMyBills,
  usePayUtilityBill,
  type UtilityType,
  type UtilityBill,
  type UtilityBillStatus,
} from "@/hooks/use-utilities";
import { utilityTypeMeta, billStatusMeta, money, formatDate } from "@/lib/utility-meta";

const utilityIcons: Record<UtilityType, React.ReactNode> = {
  water: <Droplets className="h-5 w-5" />,
  electricity: <Zap className="h-5 w-5" />,
  gas: <Flame className="h-5 w-5" />,
};

function UtilityPill({ type }: { type: UtilityType }) {
  const meta = utilityTypeMeta[type];
  return (
    <Badge className={meta.className}>
      <span className="mr-1 inline-flex">{utilityIcons[type]}</span>
      {meta.label}
    </Badge>
  );
}

export default function UtilityBillsPage() {
  const [utilityType, setUtilityType] = useState<string>("all");
  const { data, isLoading, isError, refetch } = useMyBills({
    utilityType: utilityType !== "all" ? (utilityType as UtilityType) : undefined,
  });

  const bills = useMemo(() => {
    const all = [...(data ?? [])].sort(
      (a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()
    );
    return all;
  }, [data]);

  const totalDue = bills
    .filter((b) => b.status !== "paid" && b.status !== "waived")
    .reduce((s, b) => s + Number(b.amountDue ?? 0), 0);
  const unpaidCount = bills.filter(
    (b) => b.status !== "paid" && b.status !== "waived"
  ).length;
  const maxConsumption = Math.max(1, ...bills.map((b) => Number(b.consumption ?? 0)));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Utilities</h1>
          <p className="text-muted-foreground">Your water, electricity, and gas bills</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Utilities</h1>
          <p className="text-muted-foreground">Your water, electricity, and gas bills</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load your utility bills</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Utilities</h1>
          <p className="text-muted-foreground">Your water, electricity, and gas bills</p>
        </div>
        <Select value={utilityType} onValueChange={setUtilityType}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Utilities</SelectItem>
            <SelectItem value="water">Water</SelectItem>
            <SelectItem value="electricity">Electricity</SelectItem>
            <SelectItem value="gas">Gas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-800">Outstanding Balance</CardTitle>
            <Receipt className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-700">{money(totalDue)}</div>
            <p className="text-xs text-cyan-600">{unpaidCount} bill(s) awaiting payment</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Total Bills</CardTitle>
            <Gauge className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{bills.length}</div>
            <p className="text-xs text-emerald-600">Across all utility types</p>
          </CardContent>
        </Card>
      </div>

      {bills.length === 0 ? (
        <Card className="border-accent/30 bg-gradient-to-br from-cyan-50 via-white to-teal-50">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="gold-gradient flex h-16 w-16 items-center justify-center rounded-2xl shadow-gold">
              <Droplets className="h-8 w-8 text-sidebar-primary-foreground" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="font-serif text-2xl font-bold">No utility bills yet</h2>
              <p className="text-muted-foreground">
                When your property manager issues a water, electricity, or gas bill, it will appear
                here for easy review and payment.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bills.map((bill) => (
            <BillCard key={bill.id} bill={bill} maxConsumption={maxConsumption} />
          ))}
        </div>
      )}
    </div>
  );
}

function BillCard({ bill, maxConsumption }: { bill: UtilityBill; maxConsumption: number }) {
  const pay = usePayUtilityBill();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState(String(bill.amountDue ?? ""));

  const isPaid = bill.status === "paid" || bill.status === "waived";
  const meta = utilityTypeMeta[bill.utilityType];
  const barPct = Math.min(100, (Number(bill.consumption ?? 0) / maxConsumption) * 100);
  const barColor =
    bill.utilityType === "water"
      ? "bg-blue-400"
      : bill.utilityType === "electricity"
      ? "bg-yellow-400"
      : "bg-orange-400";

  const submitPay = async () => {
    await pay.mutateAsync({
      id: bill.id,
      paidAmount: amount ? parseFloat(amount) : undefined,
    });
    setPayOpen(false);
  };

  return (
    <Card className="overflow-hidden border-accent/20">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <div className={`flex w-2 shrink-0 ${barColor}`} />
          <div className="flex flex-1 items-start gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.className}`}>
              {utilityIcons[bill.utilityType]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UtilityPill type={bill.utilityType} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {bill.meter?.meterNumber ?? "—"}
                  </span>
                </div>
                <Badge className={billStatusMeta[bill.status].className}>
                  {billStatusMeta[bill.status].label}
                </Badge>
              </div>

              <div className="mt-2 flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}
                  </p>
                  <p className="text-xl font-bold tabular-nums mt-1">{money(bill.amountDue)}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="flex items-center gap-1 justify-end">
                    <Gauge className="h-3 w-3" /> {bill.consumption} units
                  </p>
                  <p>Due {formatDate(bill.dueDate)}</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {money(bill.rate)} / unit
                </span>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {bill.status === "waived" ? "Waived" : "Paid"}
                  </span>
                ) : (
                  <Button size="sm" onClick={() => setPayOpen(true)}>
                    <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Utility Bill</DialogTitle>
            <DialogDescription>
              {meta.label} · {formatDate(bill.periodStart)} – {formatDate(bill.periodEnd)}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due</span>
              <span className="font-semibold">{money(bill.amountDue)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="payAmount">
              Amount to Pay
            </label>
            <input
              id="payAmount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPay} disabled={pay.isPending}>
              {pay.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}



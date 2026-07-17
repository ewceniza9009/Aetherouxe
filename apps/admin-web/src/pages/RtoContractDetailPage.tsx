import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/agent-meta";
import * as Tabs from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  AlertCircle,
  KeyRound,
  Home,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  BadgeDollarSign,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useRtoContract,
  useExerciseOption,
  tenantDisplayName,
  propertyDisplayName,
  type RtoStatus,
  type RtoLedgerEntry,
} from "@/hooks/use-rto";

const statusVariant: Record<RtoStatus, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  active: "success",
  grace_period: "warning",
  defaulted: "destructive",
  exercised: "default",
  completed: "secondary",
};

const statusLabel: Record<RtoStatus, string> = {
  active: "Active",
  grace_period: "Grace Period",
  defaulted: "Defaulted",
  exercised: "Exercised",
  completed: "Completed",
};

const ledgerLabel: Record<string, string> = {
  payment_credit: "Payment Credit",
  forfeiture: "Forfeiture",
  option_fee_credit: "Option Fee Credit",
};

function money(n: number | null | undefined) {
  return formatCurrency(n ?? 0);
}

export default function RtoContractDetailPage() {
  const { id } = useParams({ from: "/protected/rto/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contract, isLoading, error } = useRtoContract(id);
  const exercise = useExerciseOption();
  const [exerciseOpen, setExerciseOpen] = useState(false);

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/rto" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load RTO contract</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !contract) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalValue = Number(contract.totalContractValue ?? 0);
  const equity = Number(contract.accumulatedEquity ?? 0);
  const progress = totalValue > 0 ? Math.min(100, (equity / totalValue) * 100) : 0;
  const allocations = contract.paymentAllocations ?? [];
  const ledger = contract.equityLedger ?? [];
  const canExercise =
    !contract.isOptionExercised &&
    contract.status !== "exercised" &&
    contract.status !== "completed" &&
    contract.status !== "defaulted";

  const submitExercise = async () => {
    if (!user?.id) return;
    await exercise.mutateAsync({ id, userId: user.id });
    setExerciseOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/rto" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {canExercise && (
          <Button onClick={() => setExerciseOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" /> Exercise Option
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-bold tracking-tight">
                  {tenantDisplayName(contract)}
                </h1>
                <Badge variant={statusVariant[contract.status]}>{statusLabel[contract.status]}</Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Home className="h-4 w-4" />
                <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate({ to: `/properties/${contract.leaseAgreement?.property?.id}` })}>
                  {propertyDisplayName(contract)}
                </Button>
              </p>
              {contract.leaseAgreement && (
                <Button variant="link" className="p-0 h-auto text-xs mt-1" onClick={() => navigate({ to: `/leases/${contract.leaseAgreement!.id}` })}>
                  View Lease →
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm md:text-right">
              <div>
                <p className="text-muted-foreground flex items-center gap-1 md:justify-end">
                  <Calendar className="h-4 w-4" /> Target Purchase
                </p>
                <p className="font-medium">
                  {contract.targetPurchaseDate
                    ? new Date(contract.targetPurchaseDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1 md:justify-end">
                  <Calendar className="h-4 w-4" /> Exercised
                </p>
                <p className="font-medium">
                  {contract.exerciseDate
                    ? new Date(contract.exerciseDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Contract Value"
          value={money(totalValue)}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Monthly Rent Portion"
          value={money(contract.monthlyRentPortion)}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Monthly Equity Portion"
          value={money(contract.monthlyEquityPortion)}
        />
        <SummaryCard
          icon={<BadgeDollarSign className="h-5 w-5" />}
          label="Option Fee"
          value={money(contract.optionFeeAmount)}
        />
        <SummaryCard
          icon={<KeyRound className="h-5 w-5" />}
          label="Purchase Option Price"
          value={contract.purchaseOptionPrice != null ? money(contract.purchaseOptionPrice) : "—"}
        />
        <Card className="border-accent/40 bg-gradient-to-br from-yellow-50 to-amber-50 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Accumulated Equity</CardTitle>
            <KeyRound className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold gold-text">{money(equity)}</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-amber-100">
              <div className="gold-gradient h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-amber-700">
              {progress.toFixed(1)}% of contract value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs.Root defaultValue="ledger">
        <Tabs.List className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          <Tabs.Trigger
            value="ledger"
            className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Equity Ledger
          </Tabs.Trigger>
          <Tabs.Trigger
            value="allocations"
            className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Payment Allocations
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="ledger" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Equity Ledger</CardTitle>
              <CardDescription>Chronological equity transactions with running balance</CardDescription>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No ledger entries yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {ledger.map((entry) => (
                    <LedgerRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="allocations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Allocations</CardTitle>
              <CardDescription>Rent vs. equity split per recorded payment</CardDescription>
            </CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No payment allocations recorded yet.
                </p>
              ) : (
                <div className="rounded-md border scroll-grid">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total Paid</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Rent Portion</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Equity Portion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocations.map((a) => (
                        <tr key={a.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium tabular-nums">
                            {money(a.totalPaymentAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums">
                            {money(a.rentPortionAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-green-700">
                            {money(a.equityPortionAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog open={exerciseOpen} onOpenChange={setExerciseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Purchase Option</DialogTitle>
            <DialogDescription>
              This will mark the option as exercised for {tenantDisplayName(contract)} and credit any
              purchase option price to the equity ledger. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accumulated Equity</span>
              <span className="font-semibold text-yellow-700">{money(equity)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Option Price</span>
              <span className="font-semibold">
                {contract.purchaseOptionPrice != null ? money(contract.purchaseOptionPrice) : "—"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExerciseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitExercise} disabled={exercise.isPending || !user?.id}>
              {exercise.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Exercise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function LedgerRow({ entry }: { entry: RtoLedgerEntry }) {
  const amount = Number(entry.amount ?? 0);
  const isForfeiture = entry.transactionType === "forfeiture" || amount < 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span
          className={
            isForfeiture ? "text-red-600" : "text-green-600"
          }
        >
          {isForfeiture ? (
            <ArrowDownCircle className="h-5 w-5" />
          ) : (
            <ArrowUpCircle className="h-5 w-5" />
          )}
        </span>
        <div>
          <p className="text-sm font-medium">
            {ledgerLabel[entry.transactionType] ?? entry.transactionType.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.createdAt).toLocaleString()}
            {entry.notes ? ` · ${entry.notes}` : ""}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${isForfeiture ? "text-red-600" : "text-green-700"}`}>
          {isForfeiture ? "-" : "+"}
          {money(Math.abs(amount))}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Balance {money(entry.runningBalance)}
        </p>
      </div>
    </div>
  );
}


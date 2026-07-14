import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  KeyRound,
  Home,
  TrendingUp,
  Wallet,
  Calendar,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  ShieldCheck,
  Coins,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useMyRto,
  useExerciseOption,
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
  return `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RtoPage() {
  const { user } = useAuth();
  const { data: contract, isLoading } = useMyRto();
  const exercise = useExerciseOption();
  const [exerciseOpen, setExerciseOpen] = useState(false);

  const submitExercise = async () => {
    if (!contract || !user?.id) return;
    await exercise.mutateAsync({ id: contract.id, userId: user.id });
    setExerciseOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Rent-to-Own</h1>
          <p className="text-muted-foreground">Your path to ownership</p>
        </div>
        <Skeleton className="h-56 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Rent-to-Own</h1>
          <p className="text-muted-foreground">Your path to ownership</p>
        </div>
        <Card className="border-accent/30 bg-gradient-to-br from-yellow-50 via-white to-teal-50">
          <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="gold-gradient flex h-16 w-16 items-center justify-center rounded-2xl shadow-gold">
              <KeyRound className="h-8 w-8 text-sidebar-primary-foreground" />
            </div>
            <div className="max-w-lg space-y-2">
              <h2 className="font-serif text-2xl font-bold">Own the home you love</h2>
              <p className="text-muted-foreground">
                You don't have an active rent-to-own contract yet. With our program, a portion of
                every rent payment builds equity toward purchasing your home.
              </p>
            </div>
            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              <Benefit
                icon={<Coins className="h-5 w-5 text-accent" />}
                title="Build Equity"
                desc="Part of your rent is credited toward your future down payment."
              />
              <Benefit
                icon={<ShieldCheck className="h-5 w-5 text-accent" />}
                title="Lock Your Price"
                desc="Secure a purchase option price and plan with confidence."
              />
              <Benefit
                icon={<Home className="h-5 w-5 text-accent" />}
                title="Path to Ownership"
                desc="Transition from renting to owning on your timeline."
              />
            </div>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" /> Ask About Rent-to-Own
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = Number(contract.totalContractValue ?? 0);
  const equity = Number(contract.accumulatedEquity ?? 0);
  const target =
    contract.purchaseOptionPrice != null
      ? Number(contract.purchaseOptionPrice)
      : totalValue;
  const progress = target > 0 ? Math.min(100, (equity / target) * 100) : 0;
  const ledger = contract.equityLedger ?? [];
  const rentPortion = Number(contract.monthlyRentPortion ?? 0);
  const equityPortion = Number(contract.monthlyEquityPortion ?? 0);
  const monthlyTotal = rentPortion + equityPortion;
  const rentPct = monthlyTotal > 0 ? (rentPortion / monthlyTotal) * 100 : 0;
  const equityPct = monthlyTotal > 0 ? (equityPortion / monthlyTotal) * 100 : 0;
  const canExercise =
    !contract.isOptionExercised &&
    contract.status !== "exercised" &&
    contract.status !== "completed" &&
    contract.status !== "defaulted";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Rent-to-Own</h1>
          <p className="text-muted-foreground flex items-center gap-1">
            <Home className="h-4 w-4" />
            {contract.leaseAgreement?.property?.propertyCode ?? "Your residence"}
          </p>
        </div>
        <Badge variant={statusVariant[contract.status]}>{statusLabel[contract.status]}</Badge>
      </div>

      <Card className="overflow-hidden border-accent/30 bg-gradient-to-br from-yellow-50 via-white to-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <KeyRound className="h-5 w-5 text-accent" /> Your Path to Ownership
          </CardTitle>
          <CardDescription>Equity accumulated toward your purchase option</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Accumulated Equity</p>
            <p className="font-serif text-5xl font-bold gold-text">{money(equity)}</p>
          </div>
          <div className="space-y-1">
            <div className="h-3 w-full overflow-hidden rounded-full bg-amber-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-teal-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-amber-700">{progress.toFixed(1)}% funded</span>
              <span>Target: {money(target)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rent Portion</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(rentPortion)}</div>
            <p className="text-xs text-muted-foreground">{rentPct.toFixed(0)}% of your payment</p>
          </CardContent>
        </Card>
        <Card className="border-accent/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Monthly Equity Portion</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold gold-text">{money(equityPortion)}</div>
            <p className="text-xs text-amber-700">{equityPct.toFixed(0)}% builds your equity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Monthly Payment Split</CardTitle>
          <CardDescription>How each payment is divided</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex h-6 w-full overflow-hidden rounded-full">
            <div
              className="flex items-center justify-center bg-slate-400 text-[10px] font-semibold text-white"
              style={{ width: `${rentPct}%` }}
            >
              {rentPct >= 12 ? "Rent" : ""}
            </div>
            <div
              className="gold-gradient flex items-center justify-center text-[10px] font-semibold text-white"
              style={{ width: `${equityPct}%` }}
            >
              {equityPct >= 12 ? "Equity" : ""}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> Rent {money(rentPortion)}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Equity {money(equityPortion)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equity Timeline</CardTitle>
          <CardDescription>Your credits and adjustments over time</CardDescription>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No equity activity yet. Your credits will appear here as you make payments.
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

      <Card className="border-accent/30 bg-gradient-to-br from-teal-50 to-yellow-50">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Target Purchase Date</p>
              <p className="text-lg font-semibold">
                {contract.targetPurchaseDate
                  ? new Date(contract.targetPurchaseDate).toLocaleDateString()
                  : "To be determined"}
              </p>
            </div>
          </div>
          {canExercise ? (
            <Button onClick={() => setExerciseOpen(true)}>
              <KeyRound className="mr-2 h-4 w-4" /> Exercise Purchase Option
            </Button>
          ) : contract.isOptionExercised || contract.status === "exercised" ? (
            <Badge variant="default" className="text-sm">Option Exercised</Badge>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={exerciseOpen} onOpenChange={setExerciseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise Your Purchase Option</DialogTitle>
            <DialogDescription>
              You're about to exercise your option to purchase your home. Your accumulated equity and
              any purchase option credit will be applied. Our team will follow up to finalize the
              details.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accumulated Equity</span>
              <span className="font-semibold text-amber-700">{money(equity)}</span>
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
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Benefit({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-white/60 p-4 text-left">
      <div className="mb-2">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function LedgerRow({ entry }: { entry: RtoLedgerEntry }) {
  const amount = Number(entry.amount ?? 0);
  const isForfeiture = entry.transactionType === "forfeiture" || amount < 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span className={isForfeiture ? "text-red-600" : "text-green-600"}>
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
            {new Date(entry.createdAt).toLocaleDateString()}
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

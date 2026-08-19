import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/agent-meta';
import { api } from '@elite-realty/shared-ui/lib/api';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { Separator } from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@elite-realty/shared-ui/components/ui';
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
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import {
  useRtoContract,
  useExerciseOption,
  tenantDisplayName,
  propertyDisplayName,
  type RtoStatus,
  type RtoLedgerEntry,
} from '@/hooks/use-rto';

const statusVariant: Record<
  RtoStatus,
  'success' | 'warning' | 'destructive' | 'default' | 'secondary'
> = {
  active: 'success',
  grace_period: 'warning',
  defaulted: 'destructive',
  exercised: 'default',
  completed: 'secondary',
};

const statusLabel: Record<RtoStatus, string> = {
  active: 'Active',
  grace_period: 'Grace Period',
  defaulted: 'Defaulted',
  exercised: 'Exercised',
  completed: 'Completed',
};

const ledgerLabel: Record<string, string> = {
  payment_credit: 'Payment Credit',
  forfeiture: 'Forfeiture',
  option_fee_credit: 'Option Fee Credit',
};

function money(n: number | null | undefined) {
  return formatCurrency(n ?? 0);
}

export default function RtoContractDetailPage() {
  const { id } = useParams({ from: '/protected/rto/$id' });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: contract, isLoading, error } = useRtoContract(id);
  const { data: aiReport } = useQuery({
    queryKey: ['rto-ai-score', id],
    queryFn: async () => {
      const res = await api.get(`/ai/rto-score/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
  const exercise = useExerciseOption();
  const [exerciseOpen, setExerciseOpen] = useState(false);

  if (error) {
    return (
      <div className="space-y-6 flex flex-col ">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/rto' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
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
    contract.status !== 'exercised' &&
    contract.status !== 'completed' &&
    contract.status !== 'defaulted';

  const submitExercise = async () => {
    if (!user?.id) return;
    await exercise.mutateAsync({ id, userId: user.id });
    setExerciseOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/rto' })}>
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
                <Badge variant={statusVariant[contract.status]}>
                  {statusLabel[contract.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Home className="h-4 w-4" />
                <Button
                  variant="link"
                  className="p-0 h-auto text-muted-foreground"
                  onClick={() =>
                    navigate({ to: `/properties/${contract.leaseAgreement?.property?.id}` })
                  }
                >
                  {propertyDisplayName(contract)}
                </Button>
              </p>
              {contract.leaseAgreement && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs mt-1"
                  onClick={() => navigate({ to: `/leases/${contract.leaseAgreement!.id}` })}
                >
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
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1 md:justify-end">
                  <Calendar className="h-4 w-4" /> Exercised
                </p>
                <p className="font-medium">
                  {contract.exerciseDate
                    ? new Date(contract.exerciseDate).toLocaleDateString()
                    : '—'}
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
          value={contract.purchaseOptionPrice != null ? money(contract.purchaseOptionPrice) : '—'}
        />
        <Card className="border-accent/40 bg-gradient-to-br from-yellow-50 to-amber-50 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Accumulated Equity</CardTitle>
            <KeyRound className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-bold gold-text">{money(equity)}</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-amber-100">
              <div
                className="gold-gradient h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-amber-700">{progress.toFixed(1)}% of contract value</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Real Estate Intelligence Widget */}
      {aiReport && (
        <Card className="border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 overflow-hidden shadow-xl">
          <CardHeader className="border-b border-slate-800/80 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    AI Conversion &amp; Credit Intelligence
                    <Badge
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        aiReport.delinquencyRiskTier === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : aiReport.delinquencyRiskTier === 'MODERATE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {aiReport.delinquencyRiskTier} Risk Tier
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Predictive analysis based on rental reliability, utility stability &amp; equity
                    coverage
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    AI Credit Score
                  </span>
                  <div className="text-xl font-black text-white">
                    {aiReport.creditScore}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ 850</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Conversion Readiness
                  </span>
                  <div className="text-xl font-black text-emerald-400">
                    {aiReport.conversionReadinessIndex}%
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Factor Scores Progress */}
            {(() => {
              const factors = aiReport.factors || {
                paymentReliabilityScore: 0,
                utilityStabilityScore: 0,
                equityAccumulationScore: 0,
                arDelinquencyScore: 0,
              };
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Payment Reliability</span>
                    <div className="text-lg font-bold text-white">
                      {factors.paymentReliabilityScore ?? 0}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${factors.paymentReliabilityScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Utility Stability</span>
                    <div className="text-lg font-bold text-white">
                      {factors.utilityStabilityScore ?? 0}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${factors.utilityStabilityScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Equity Progress</span>
                    <div className="text-lg font-bold text-white">
                      {factors.equityAccumulationScore ?? 0}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${factors.equityAccumulationScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">AR Health Score</span>
                    <div className="text-lg font-bold text-white">
                      {factors.arDelinquencyScore ?? 0}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${factors.arDelinquencyScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Recommendations */}
            {(aiReport.aiRecommendations || []).length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  AI Recommended Next Steps
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {(aiReport.aiRecommendations || []).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <CardDescription>
                Chronological equity transactions with running balance
              </CardDescription>
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Total Paid
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Rent Portion
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Equity Portion
                        </th>
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
              This will mark the option as exercised for {tenantDisplayName(contract)} and credit
              any purchase option price to the equity ledger. This action cannot be undone.
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
                {contract.purchaseOptionPrice != null ? money(contract.purchaseOptionPrice) : '—'}
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
  const isForfeiture = entry.transactionType === 'forfeiture' || amount < 0;
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <span className={isForfeiture ? 'text-red-600' : 'text-green-600'}>
          {isForfeiture ? (
            <ArrowDownCircle className="h-5 w-5" />
          ) : (
            <ArrowUpCircle className="h-5 w-5" />
          )}
        </span>
        <div>
          <p className="text-sm font-medium">
            {ledgerLabel[entry.transactionType] ?? entry.transactionType.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(entry.createdAt).toLocaleString()}
            {entry.notes ? ` · ${entry.notes}` : ''}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold tabular-nums ${isForfeiture ? 'text-red-600' : 'text-green-700'}`}
        >
          {isForfeiture ? '-' : '+'}
          {money(Math.abs(amount))}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Balance {money(entry.runningBalance)}
        </p>
      </div>
    </div>
  );
}

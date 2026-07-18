import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  DoorOpen,
  Percent,
  FileText,
  DollarSign,
  Wallet,
  Wrench,
  KeyRound,
  PiggyBank,
  TrendingUp,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { usePortfolioKpis, useRevenueTrend } from "@/hooks/use-reports";
import { formatCurrency } from "@/lib/agent-meta";

type Tone = "default" | "gold" | "rose";

interface Kpi {
  label: string;
  value: string | number;
  icon: typeof Building2;
  tone: Tone;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const valueClass =
    kpi.tone === "gold"
      ? "gold-text"
      : kpi.tone === "rose"
        ? "text-rose-500"
        : "text-foreground";
  const iconClass =
    kpi.tone === "gold"
      ? "bg-primary/15 text-primary"
      : kpi.tone === "rose"
        ? "bg-rose-500/15 text-rose-500"
        : "bg-muted text-muted-foreground";
  return (
    <Card className="hover:border-primary/30 transition-all duration-300">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {kpi.label}
          </p>
          <p className={`mt-2 text-2xl font-bold tabular-nums ${valueClass}`}>
            {kpi.value}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: kpis, isLoading, isError } = usePortfolioKpis();
  const { data: trend, isLoading: trendLoading } = useRevenueTrend(6);

  const revenue = trend ?? [];
  const maxRevenue = Math.max(1, ...revenue.map((r) => r.revenue));

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isError || !kpis) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-serif gold-text">
          Portfolio Analytics
        </h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Unable to load portfolio analytics.</p>
            <p className="text-sm text-muted-foreground">
              Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards: Kpi[] = [
    { label: "Total Properties", value: kpis.totalProperties, icon: Building2, tone: "default" },
    { label: "Total Units", value: kpis.totalUnits, icon: DoorOpen, tone: "default" },
    {
      label: "Occupancy Rate",
      value: `${kpis.occupancyRate.toFixed(1)}%`,
      icon: Percent,
      tone: "default",
    },
    { label: "Active Leases", value: kpis.activeLeases, icon: FileText, tone: "default" },
    {
      label: "Monthly Recurring Revenue",
      value: formatCurrency(kpis.monthlyRecurringRevenue),
      icon: DollarSign,
      tone: "gold",
    },
    {
      label: "Total Receivable",
      value: formatCurrency(kpis.totalReceivable),
      icon: Wallet,
      tone: "rose",
    },
    {
      label: "Open Service Requests",
      value: kpis.openServiceRequests,
      icon: Wrench,
      tone: "default",
    },
    {
      label: "Active RTO Contracts",
      value: kpis.activeRtoContracts,
      icon: KeyRound,
      tone: "default",
    },
    {
      label: "Total Equity Accumulated",
      value: formatCurrency(kpis.totalEquityAccumulated),
      icon: PiggyBank,
      tone: "gold",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight gold-text">
          Portfolio Analytics
        </h1>
        <p className="text-muted-foreground">
          Key performance indicators across the entire managed portfolio.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c) => (
          <KpiCard key={c.label} kpi={c} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Revenue Trend
          </CardTitle>
          <CardDescription>
            Monthly recurring revenue over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="h-44 w-full" />
          ) : revenue.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No revenue data available.
            </p>
          ) : (
            <div className="flex h-44 items-end justify-between gap-3">
              {revenue.map((r) => (
                <div key={r.month} className="flex flex-1 flex-col items-center gap-2 h-full">
                  <div className="relative w-full flex-1">
                    <div
                      className="gold-gradient absolute bottom-0 left-0 w-full rounded-t-md transition-all duration-500"
                      style={{ height: `${(r.revenue / maxRevenue) * 100}%` }}
                      title={formatCurrency(r.revenue)}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {formatCurrency(r.revenue)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base">Accounts Receivable</CardTitle>
            <CardDescription>Outstanding balances across tenants</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold gold-text tabular-nums">
                {formatCurrency(kpis.totalReceivable)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Total receivable</p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: "/collections/ar-aging" })}>
              View AR Aging <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base">Collections</CardTitle>
            <CardDescription>Payments, reminders &amp; collection cases</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {kpis.activeLeases}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Active leases</p>
            </div>
            <Button onClick={() => navigate({ to: "/collections" })}>
              Go to Collections <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />
    </div>
  );
}

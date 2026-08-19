import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import {
  Building2,
  DollarSign,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { usePortfolioStats, useMyProperties, formatCurrency } from '@/hooks/use-owner-portal';

export default function OwnerDashboardPage() {
  const { data: stats, isLoading: loadingStats } = usePortfolioStats();
  const { data: properties, isLoading: loadingProps } = useMyProperties();

  const isLoading = loadingStats || loadingProps;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      </div>
    );
  }

  const portfolioStats = [
    {
      title: 'Properties Owned',
      value: stats?.totalProperties ?? 0,
      icon: Building2,
      change: `${stats?.totalUnits ?? 0} total units`,
      positive: true,
      color: 'from-amber-500/20 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    {
      title: 'Portfolio Occupancy',
      value: `${stats?.occupancyRate ?? 0}%`,
      icon: TrendingUp,
      change: `${stats?.occupiedUnits ?? 0}/${stats?.totalUnits ?? 0} active leases`,
      positive: (stats?.occupancyRate ?? 0) >= 80,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
    {
      title: 'Cap Rate / Yield',
      value: `${stats?.avgYield ?? 0}%`,
      icon: PieChart,
      change: 'Weighted annual return',
      positive: (stats?.avgYield ?? 0) > 0,
      color: 'from-sky-500/20 to-sky-500/5',
      iconColor: 'text-sky-500',
    },
    {
      title: 'Net Rental Cashflow',
      value: formatCurrency(stats?.totalNetIncome),
      icon: DollarSign,
      change: `${formatCurrency(stats?.totalGrossIncome)} gross`,
      positive: (stats?.totalNetIncome ?? 0) > 0,
      color: 'from-indigo-500/20 to-indigo-500/5',
      iconColor: 'text-indigo-500',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Wealth Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-8 border border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Private Wealth Portal
              </span>
              <span className="text-xs text-slate-400">Institutional Yield Analytics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
              Portfolio Overview & Yield
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Real-time asset valuation, automated dividend distributions, and real estate cashflow
              intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/portfolio"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Yield Analytics
            </Link>
            <Link
              to="/pnl"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-md transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              P&L Statements
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Unified KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {portfolioStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="relative overflow-hidden border-border/80 bg-card hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.color} rounded-bl-full pointer-events-none`}
              />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div
                  className={`p-2 rounded-xl bg-background border border-border/80 ${stat.iconColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  {stat.value}
                </div>
                <p
                  className={`text-xs font-medium flex items-center gap-1.5 pt-1 ${
                    stat.positive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {stat.positive ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  <span>{stat.change}</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2-Column Asset Management Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Real Estate Holdings */}
        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Real Estate Holdings
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active asset properties under management
              </p>
            </div>
            <Link
              to="/properties"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {(!properties || properties.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No active properties assigned to this portfolio.
              </div>
            )}
            {properties?.map((prop) => (
              <div
                key={prop.id}
                className="p-4 rounded-2xl bg-muted/40 border border-border/60 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{prop.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {prop.propertyType.replace(/_/g, ' ')} • {prop.totalUnits} Units
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {prop.occupancy}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">Occupied</span>
                  </div>
                  <p className="text-xs font-black text-foreground">
                    {formatCurrency(prop.monthlyIncome)}/mo
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Flow Distribution */}
        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Financial Cashflow Breakdown
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gross revenue vs. operational expenditure
              </p>
            </div>
            <Link
              to="/financials"
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Gross Rental Revenue</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(stats?.totalGrossIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Operating Expenses & Maintenance
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(stats?.totalExpenses)}
                </span>
              </div>
              <div className="border-t border-border/80 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Net Operating Income (NOI)
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(stats?.totalNetIncome)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">
                    Automated Yield Disbursements
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Direct ACH/Bank settlement scheduled on 1st of month
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { Separator } from '@elite-realty/shared-ui/components/ui';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  PieChart,
  TrendingUp,
  Building2,
  AlertCircle,
  FileSearch,
  Wallet,
  Scissors,
  Wrench,
  Percent,
} from 'lucide-react';
import {
  useMyPnl,
  formatCurrency,
  formatDate,
  PNL_STATUS_STYLES,
  type OwnerPnl,
} from '@/hooks/use-owner-portal';

function PnlCard({ statement }: { statement: OwnerPnl }) {
  const status = PNL_STATUS_STYLES[statement.status];
  const gross = statement.grossRentalIncome ?? 0;
  const mgmtFee = statement.managementFee ?? 0;
  const expenses = statement.totalExpenses ?? 0;
  const net = statement.netIncome ?? 0;
  const yieldPct = statement.yieldPct;

  return (
    <Card className="hover:border-primary/30 hover:shadow-gold transition-all duration-300">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base leading-tight">{statement.propertyName}</CardTitle>
            <CardDescription className="text-sm">
              {formatDate(statement.periodStart)} - {formatDate(statement.periodEnd)}
            </CardDescription>
          </div>
        </div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Income */}
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              Income
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Gross Rental Income</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(gross)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Scissors className="h-3.5 w-3.5" />
            Deductions
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-dashed">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5 text-rose-500" /> Management Fee
            </span>
            <span className="text-sm font-medium text-rose-600">-{formatCurrency(mgmtFee)}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-dashed">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-rose-500" /> Maintenance & Operating
            </span>
            <span className="text-sm font-medium text-rose-600">-{formatCurrency(expenses)}</span>
          </div>
        </div>

        {/* Net Income */}
        <Separator />
        <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Net Income
              </p>
              <p className="mt-1 text-3xl font-bold gold-text">{formatCurrency(net)}</p>
            </div>
            {yieldPct != null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Yield
                </p>
                <p className="text-xl font-semibold text-emerald-600">{yieldPct}%</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PnlSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PnlPage() {
  const navigate = useNavigate();
  const { data: statements, isLoading, isError } = useMyPnl();

  const totalGross = (statements ?? []).reduce((sum, s) => sum + (s.grossRentalIncome ?? 0), 0);
  const totalMgmt = (statements ?? []).reduce((sum, s) => sum + (s.managementFee ?? 0), 0);
  const totalExpenses = (statements ?? []).reduce((sum, s) => sum + (s.totalExpenses ?? 0), 0);
  const totalNet = (statements ?? []).reduce((sum, s) => sum + (s.netIncome ?? 0), 0);
  const totalYield =
    (statements ?? []).filter((s) => s.yieldPct != null).length > 0
      ? (statements ?? []).reduce((sum, s) => sum + (s.yieldPct ?? 0), 0) /
        Math.max((statements ?? []).filter((s) => s.yieldPct != null).length, 1)
      : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: '/dashboard' })}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profit &amp; Loss</h1>
        <p className="text-muted-foreground">Your property performance statements</p>
      </div>

      {/* Summary hero */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-card/80 to-transparent shadow-gold">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <PieChart className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Net Income</p>
              <p className="text-4xl font-bold gold-text">{formatCurrency(totalNet)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                From {formatCurrency(totalGross)} gross less{' '}
                {formatCurrency(totalMgmt + totalExpenses)} in fees & expenses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Avg. Yield</p>
              <p className="text-2xl font-semibold flex items-center justify-end gap-1">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {totalYield != null ? `${totalYield.toFixed(1)}%` : '—'}
              </p>
            </div>
            <Separator orientation="vertical" className="hidden h-12 md:block" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Statements</p>
              <p className="text-2xl font-semibold">{(statements ?? []).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <PnlSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Unable to load your statements</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      ) : !statements || statements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">No statements yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once your properties start generating periodic reports, your profit &amp; loss
              statements will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {statements.map((s) => (
            <PnlCard key={s.id} statement={s} />
          ))}
        </div>
      )}
    </div>
  );
}

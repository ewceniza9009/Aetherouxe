import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, PieChart, TrendingUp, Building2, AlertCircle, FileSearch } from "lucide-react";
import {
  useMyPnl,
  formatCurrency,
  PNL_STATUS_STYLES,
  type OwnerPnl,
} from "@/hooks/use-owner-portal";

function PnlCard({ statement }: { statement: OwnerPnl }) {
  const status = PNL_STATUS_STYLES[statement.status];
  return (
    <Card className="hover:border-primary/30 hover:shadow-gold transition-all duration-300">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base leading-tight">{statement.propertyName}</CardTitle>
            <CardDescription className="text-sm">{statement.period}</CardDescription>
          </div>
        </div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Net Income</p>
          <p className="mt-1 text-3xl font-bold gold-text">{formatCurrency(statement.netIncome)}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Gross</p>
            <p className="text-sm font-semibold">{formatCurrency(statement.grossIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-sm font-semibold text-rose-600">{formatCurrency(statement.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Yield</p>
            <p className="text-sm font-semibold text-emerald-600">
              {statement.yieldPct != null ? `${statement.yieldPct}%` : "—"}
            </p>
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

  const totalNet = (statements ?? []).reduce((sum, s) => sum + (s.netIncome ?? 0), 0);
  const totalYield =
    (statements ?? []).filter((s) => s.yieldPct != null).length > 0
      ? (statements ?? []).reduce((sum, s) => sum + (s.yieldPct ?? 0), 0) /
        Math.max((statements ?? []).filter((s) => s.yieldPct != null).length, 1)
      : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
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
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Avg. Yield</p>
              <p className="text-2xl font-semibold flex items-center justify-end gap-1">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {totalYield != null ? `${totalYield.toFixed(1)}%` : "—"}
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
              Once your properties start generating periodic reports, your profit &amp; loss statements will
              appear here.
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

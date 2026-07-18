import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Clock, Users, Building2, FileText, BarChart3 } from "lucide-react";
import {
  useArAging,
  AR_BUCKETS,
  bucketTone,
  formatCurrency,
  formatDate,
} from "@/hooks/use-collections";

const AGING_COLUMNS: { label: string; tone: string; min: number; max: number | null }[] = [
  { label: "Current", tone: "text-green-600", min: -Infinity, max: 0 },
  { label: "31-60", tone: "text-lime-600", min: 1, max: 30 },
  { label: "61-90", tone: "text-yellow-600", min: 31, max: 60 },
  { label: "91-120", tone: "text-orange-600", min: 61, max: 90 },
  { label: "120+", tone: "text-red-600", min: 91, max: null },
];

function agingColumnKey(daysOverdue: number): string {
  for (const col of AGING_COLUMNS) {
    if (daysOverdue >= col.min && (col.max === null || daysOverdue <= col.max)) {
      return col.label;
    }
  }
  return AGING_COLUMNS[0].label;
}

export default function ArAgingPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useArAging();

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">AR Aging</h1>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">
              Unable to load the accounts receivable aging report.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reportBuckets = data.buckets ?? [];
  const buckets = AR_BUCKETS.map((expected) => {
    const found = reportBuckets.find((b) => b.label === expected.label);
    return {
      label: expected.label,
      total: found?.total ?? 0,
      count: found?.count ?? 0,
      tone: expected.tone,
      bar: expected.bar,
    };
  });

  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));
  const maxProperty = Math.max(1, ...(data.byProperty ?? []).map((p) => p.outstanding));
  const invoices = data.invoices ?? [];
  const currentTotal = buckets
    .filter((b) => b.label === "0-30")
    .reduce((s, b) => s + b.total, 0);
  const overdueTotal = buckets
    .filter((b) => b.label !== "0-30")
    .reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">AR Aging</h1>
          <p className="text-muted-foreground">
            Outstanding accounts receivable, by age
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/collections" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Collections
        </Button>
      </div>

      {/* Total Receivable — always visible above tabs */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200">
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-amber-800">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Total Receivable
            </span>
          </div>
          <div className="mt-2 text-5xl font-bold gold-text tabular-nums">
            {formatCurrency(data.totalReceivable)}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="by-tenant" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">By Tenant</span>
          </TabsTrigger>
          <TabsTrigger value="by-property" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">By Property</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab: Aging Buckets ─── */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {buckets.map((b) => (
              <Card key={b.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {b.label === "0-30" ? "Current (0-30)" : `Days ${b.label}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold tabular-nums ${b.tone}`}>
                    {formatCurrency(b.total)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.count} accounts</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-1.5 rounded-full ${b.bar}`}
                      style={{ width: `${(b.total / maxBucket) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Aging distribution bar */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4" /> Aging Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                  {buckets.map((b) =>
                    b.total > 0 ? (
                      <div
                        key={b.label}
                        className={b.bar}
                        style={{
                          width: `${(b.total / (data.totalReceivable || 1)) * 100}%`,
                        }}
                        title={`${b.label}: ${formatCurrency(b.total)}`}
                      />
                    ) : null,
                  )}
                </div>
                <div className="space-y-3">
                  {buckets.map((b) => {
                    const pct =
                      data.totalReceivable > 0
                        ? (b.total / data.totalReceivable) * 100
                        : 0;
                    return (
                      <div
                        key={b.label}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${b.bar}`} />
                          <span className="text-muted-foreground">
                            {b.label === "0-30" ? "Current (0-30)" : `Days ${b.label}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-12 text-right tabular-nums text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                          <span className="w-28 text-right font-semibold tabular-nums">
                            {formatCurrency(b.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Summary stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" /> Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total Receivable
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {formatCurrency(data.totalReceivable)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Current
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-green-600">
                      {formatCurrency(currentTotal)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Overdue
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-red-600">
                      {formatCurrency(overdueTotal)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Accounts
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {(data.byTenant ?? []).length}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Invoices
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {invoices.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── By Tenant Tab ─── */}
        <TabsContent value="by-tenant" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> By Tenant
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.byTenant ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No outstanding balances by tenant.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Worst Bucket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.byTenant ?? []).map((t) => {
                      const tone = bucketTone(t.worstBucket);
                      return (
                        <TableRow key={t.tenantId}>
                          <TableCell className="font-medium">{t.tenantName}</TableCell>
                          <TableCell className="tabular-nums font-semibold">
                            {formatCurrency(t.outstanding)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={tone.tone}>
                              {t.worstBucket}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── By Property Tab ─── */}
        <TabsContent value="by-property" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> By Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.byProperty ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No outstanding balances by property.
                </p>
              ) : (
                <div className="space-y-4">
                  {(data.byProperty ?? []).map((p) => (
                    <div key={p.propertyId ?? p.propertyName}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{p.propertyName}</span>
                        <span className="tabular-nums text-primary">
                          {formatCurrency(p.outstanding)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="gold-gradient h-2.5 rounded-full"
                          style={{ width: `${(p.outstanding / maxProperty) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Invoice Detail Tab ─── */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Invoice Aging Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No outstanding invoices.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due</TableHead>
                        {AGING_COLUMNS.map((col) => (
                          <TableHead key={col.label} className={`text-right ${col.tone}`}>
                            {col.label}
                          </TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow key={inv.invoiceId}>
                          <TableCell className="font-mono text-xs">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-medium">{inv.tenantName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {inv.propertyCode ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm capitalize">
                            {inv.invoiceType.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(inv.dueDate)}</TableCell>
                          {AGING_COLUMNS.map((col) => {
                            const inThisBucket = agingColumnKey(inv.daysOverdue) === col.label;
                            return (
                              <TableCell
                                key={col.label}
                                className={`text-right tabular-nums ${
                                  inThisBucket ? `font-semibold ${col.tone}` : "text-muted-foreground/30"
                                }`}
                              >
                                {inThisBucket ? formatCurrency(inv.outstanding) : "—"}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right tabular-nums font-semibold">
                            {formatCurrency(inv.outstanding)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-semibold">
                        <TableCell colSpan={5} className="text-right">
                          Total
                        </TableCell>
                        {AGING_COLUMNS.map((col) => {
                          const sum = invoices
                            .filter((inv) => agingColumnKey(inv.daysOverdue) === col.label)
                            .reduce((s, inv) => s + inv.outstanding, 0);
                          return (
                            <TableCell
                              key={col.label}
                              className={`text-right tabular-nums ${col.tone}`}
                            >
                              {sum > 0 ? formatCurrency(sum) : "—"}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(
                            invoices.reduce((s, inv) => s + inv.outstanding, 0),
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

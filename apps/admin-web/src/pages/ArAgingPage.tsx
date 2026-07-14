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
import { ArrowLeft, Clock, Users, Building2 } from "lucide-react";
import {
  useArAging,
  AR_BUCKETS,
  bucketTone,
  formatCurrency,
} from "@/hooks/use-collections";

export default function ArAgingPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useArAging();

  if (isLoading) {
    return (
      <div className="space-y-6">
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
        <Card>
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
  const maxTenant = Math.max(1, ...(data.byTenant ?? []).map((t) => t.outstanding));
  const maxProperty = Math.max(1, ...(data.byProperty ?? []).map((p) => p.outstanding));

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
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
            {(data.byTenant ?? []).length > 0 && (
              <div className="mt-4 space-y-2">
                {(data.byTenant ?? []).map((t) => (
                  <div key={t.tenantId}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{t.tenantName}</span>
                      <span className="tabular-nums text-primary">
                        {formatCurrency(t.outstanding)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-red-400"
                        style={{ width: `${(t.outstanding / maxTenant) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}

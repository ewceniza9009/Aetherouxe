import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowRight,
  Clock,
  Users,
  Building2,
  BarChart3,
  Wallet,
} from "lucide-react";
import { useCommissionAging, type CommissionAgingBucket } from "@/hooks/use-commissions";
import { formatCurrency } from "@/lib/agent-meta";

const EXPECTED_BUCKETS: { label: string; tone: string; bar: string }[] = [
  { label: "0-30", tone: "text-green-500", bar: "bg-green-500" },
  { label: "31-60", tone: "text-lime-500", bar: "bg-lime-500" },
  { label: "61-90", tone: "text-yellow-500", bar: "bg-yellow-500" },
  { label: "91-120", tone: "text-orange-500", bar: "bg-orange-500" },
  { label: "120+", tone: "text-red-500", bar: "bg-red-500" },
];

function bucketTone(label: string): { tone: string; bar: string } {
  return (
    EXPECTED_BUCKETS.find((b) => b.label === label) ?? {
      tone: "text-muted-foreground",
      bar: "bg-muted-foreground",
    }
  );
}

export default function CommissionAgingPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCommissionAging();

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col ">
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
        <h1 className="text-3xl font-bold tracking-tight">Commission Aging</h1>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">
              Unable to load commission aging report.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const reportBuckets: CommissionAgingBucket[] = data.buckets ?? [];
  const buckets = EXPECTED_BUCKETS.map((expected) => {
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
  const maxProject = Math.max(1, ...(data.byProject ?? []).map((p) => p.total));
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
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Commission Aging
          </h1>
          <p className="text-muted-foreground">
            Outstanding commissions owed to agents, by age. Click an agent to
            record a payout.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/commissions" })}>
          Manage Rules <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Total Unpaid — always visible above tabs */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200">
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-amber-800">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wide">
              Total Unpaid Commissions
            </span>
          </div>
          <div className="mt-2 text-5xl font-bold gold-text tabular-nums">
            {formatCurrency(data.totalUnpaid)}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="by-agent" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">By Agent</span>
          </TabsTrigger>
          <TabsTrigger value="by-project" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">By Project</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─── */}
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.count} commissions
                  </p>
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
            {/* Aging distribution */}
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
                          width: `${(b.total / (data.totalUnpaid || 1)) * 100}%`,
                        }}
                        title={`${b.label}: ${formatCurrency(b.total)}`}
                      />
                    ) : null,
                  )}
                </div>
                <div className="space-y-3">
                  {buckets.map((b) => {
                    const pct =
                      data.totalUnpaid > 0
                        ? (b.total / data.totalUnpaid) * 100
                        : 0;
                    return (
                      <div
                        key={b.label}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${b.bar}`} />
                          <span className="text-muted-foreground">
                            {b.label === "0-30"
                              ? "Current (0-30)"
                              : `Days ${b.label}`}
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

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" /> Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total Unpaid
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {formatCurrency(data.totalUnpaid)}
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
                      Agents
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {(data.byAgent ?? []).length}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Projects
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {(data.byProject ?? []).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── By Agent Tab ─── */}
        <TabsContent value="by-agent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> By Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.byAgent ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No outstanding balances by agent.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Unpaid</TableHead>
                      <TableHead>Worst Bucket</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.byAgent ?? []).map((a) => {
                      const tone = bucketTone(a.worstBucket);
                      return (
                        <TableRow
                          key={a.agentId}
                          className="cursor-pointer"
                          onClick={() => navigate({ to: `/agents/${a.agentId}` })}
                        >
                          <TableCell className="font-medium">
                            {a.agentName}
                          </TableCell>
                          <TableCell className="tabular-nums font-semibold">
                            {formatCurrency(a.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={tone.tone}>
                              {a.worstBucket}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate({ to: `/agents/${a.agentId}` });
                              }}
                            >
                              <Wallet className="mr-1 h-3.5 w-3.5" /> Pay
                            </Button>
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

        {/* ─── By Project Tab ─── */}
        <TabsContent value="by-project" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> By Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.byProject ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No outstanding balances by project.
                </p>
              ) : (
                <div className="space-y-4">
                  {(data.byProject ?? []).map((p) => (
                    <div key={p.projectId ?? p.projectName}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{p.projectName}</span>
                        <span className="tabular-nums text-primary">
                          {formatCurrency(p.total)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="gold-gradient h-2.5 rounded-full"
                          style={{ width: `${(p.total / maxProject) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

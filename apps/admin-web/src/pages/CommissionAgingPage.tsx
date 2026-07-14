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
import { ArrowRight, Clock, Users, Building2 } from "lucide-react";
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
        <h1 className="text-3xl font-bold tracking-tight">Commission Aging</h1>
        <Card>
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
  const maxAgent = Math.max(1, ...(data.byAgent ?? []).map((a) => a.total));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Aging</h1>
          <p className="text-muted-foreground">
            Outstanding commissions owed to agents, by age
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/commissions" })}>
          Manage Rules <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

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
              <p className="mt-1 text-xs text-muted-foreground">{b.count} invoices</p>
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
                        <TableCell className="font-medium">{a.agentName}</TableCell>
                        <TableCell className="tabular-nums font-semibold">
                          {formatCurrency(a.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tone.tone}>
                            {a.worstBucket}
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
      </div>
    </div>
  );
}

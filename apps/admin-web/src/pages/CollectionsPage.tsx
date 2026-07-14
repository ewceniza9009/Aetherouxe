import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Wallet,
  FolderOpen,
  BellRing,
  Loader2,
  ArrowRight,
  Inbox,
} from "lucide-react";
import {
  useArAging,
  useCollectionCases,
  usePaymentReminders,
  useGenerateReminders,
  useOpenOverdueCases,
  AR_BUCKETS,
  bucketTone,
  CASE_STATUS_VARIANT,
  CASE_STATUS_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_PRIORITY_LABELS,
  formatCurrency,
} from "@/hooks/use-collections";

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { data: aging, isLoading: loadingAging } = useArAging();
  const { data: cases, isLoading: loadingCases } = useCollectionCases();
  const { data: reminders, isLoading: loadingReminders } = usePaymentReminders({
    status: "pending",
  });
  const generate = useGenerateReminders();
  const openCases = useOpenOverdueCases();

  const totalReceivable = aging?.totalReceivable ?? 0;
  const reportBuckets = aging?.buckets ?? [];
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
  const openCasesCount = (cases ?? []).filter(
    (c) => c.status === "open" || c.status === "in_progress" || c.status === "escalated"
  ).length;
  const overdueReminders = (reminders ?? []).length;
  const recentCases = (cases ?? []).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Accounts receivable, reminders, and collection cases
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="mr-2 h-4 w-4" />
            )}
            Generate Overdue Reminders
          </Button>
          <Button
            onClick={() => openCases.mutate()}
            disabled={openCases.isPending}
          >
            {openCases.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="mr-2 h-4 w-4" />
            )}
            Open Overdue Cases
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">
              Total Receivable
            </CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loadingAging ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">
                  {formatCurrency(totalReceivable)}
                </div>
                <p className="text-xs text-amber-600">Across all tenants</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">Open Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loadingCases ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-rose-700">{openCasesCount}</div>
                <p className="text-xs text-rose-600">Active collection cases</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Overdue Reminders
            </CardTitle>
            <Inbox className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loadingReminders ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-orange-700">{overdueReminders}</div>
                <p className="text-xs text-orange-600">Pending reminders</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold">Aging of Receivables</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/collections/ar-aging" })}
          >
            Detailed Report <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {AR_BUCKETS.map((expected, i) => {
            const b = buckets[i];
            const tone = bucketTone(expected.label);
            return (
              <Card key={expected.label} className={tone.soft}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {expected.label === "0-30"
                      ? "Current (0-30)"
                      : `Days ${expected.label}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold tabular-nums ${b.tone}`}>
                    {formatCurrency(b.total)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.count} accounts</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/60">
                    <div
                      className={`h-1.5 rounded-full ${b.bar}`}
                      style={{
                        width: `${totalReceivable > 0 ? (b.total / totalReceivable) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-accent" /> Recent Collection Cases
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/collections/cases" })}
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCases ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentCases.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No collection cases yet.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Next Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCases.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: `/collections/cases/${c.id}` })}
                    >
                      <TableCell className="font-mono text-sm">{c.caseNumber}</TableCell>
                      <TableCell className="font-medium">{c.tenantName}</TableCell>
                      <TableCell>
                        <Badge variant={CASE_PRIORITY_VARIANT[c.priority]}>
                          {CASE_PRIORITY_LABELS[c.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={CASE_STATUS_VARIANT[c.status]}>
                          {CASE_STATUS_LABELS[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">
                        {formatCurrency(c.outstandingAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.nextActionDate
                          ? new Date(c.nextActionDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

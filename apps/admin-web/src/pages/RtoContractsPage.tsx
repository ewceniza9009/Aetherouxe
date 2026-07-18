import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/agent-meta";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import { ShieldAlert, Loader2 } from "lucide-react";
import {
  useRtoContracts,
  useCheckDefault,
  tenantDisplayName,
  propertyDisplayName,
  type RtoContract,
  type RtoStatus,
} from "@/hooks/use-rto";

const statusVariant: Record<RtoStatus, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  active: "success",
  grace_period: "warning",
  defaulted: "destructive",
  exercised: "default",
  completed: "secondary",
};

const statusLabel: Record<RtoStatus, string> = {
  active: "Active",
  grace_period: "Grace Period",
  defaulted: "Defaulted",
  exercised: "Exercised",
  completed: "Completed",
};

function money(n: number) {
  return formatCurrency(n ?? 0);
}

export default function RtoContractsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const fullQuery = useMemo(
    () => ({
      ...query,
      status: statusFilter !== "all" ? (statusFilter as RtoStatus) : undefined,
    }),
    [query, statusFilter]
  );

  const { data, isLoading, isError, refetch } = useRtoContracts(fullQuery);
  const checkDefault = useCheckDefault();

  const contracts = data?.data ?? [];
  const meta = data?.meta;

  const runDefaultCheck = async () => {
    setCheckResult(null);
    const candidate =
      contracts.find((c) => c.status === "active" || c.status === "grace_period") ??
      contracts[0];
    if (!candidate) {
      setCheckResult("No contracts available to check.");
      return;
    }
    try {
      const result = await checkDefault.mutateAsync(candidate.id);
      setCheckResult(
        `Checked ${result.contractsChecked} contract(s) · ${result.defaulted.length} defaulted · ${result.gracePeriod.length} in grace period.`
      );
      refetch();
    } catch {
      setCheckResult("Default check failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Rent-to-Own</h1>
          <p className="text-muted-foreground">Track equity accumulation and purchase options</p>
        </div>
        <Button onClick={runDefaultCheck} disabled={checkDefault.isPending}>
          {checkDefault.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShieldAlert className="mr-2 h-4 w-4" />
          )}
          Run Default Check
        </Button>
      </div>

      {checkResult && (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="flex items-center gap-3 py-4">
            <ShieldAlert className="h-5 w-5 text-accent" />
            <p className="text-sm">{checkResult}</p>
          </CardContent>
        </Card>
      )}

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search contracts…"
        filters={
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); resetPage(); }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="grace_period">Grace Period</SelectItem>
              <SelectItem value="defaulted">Defaulted</SelectItem>
              <SelectItem value="exercised">Exercised</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={contracts.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contract</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Buyer</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Property</th>
                    <th {...sortHeader("status", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("status")}
                    </th>
                    <th {...sortHeader("accumulatedEquity", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Accumulated Equity{sortIndicator("accumulatedEquity")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Target Purchase</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c: RtoContract) => (
                    <tr
                      key={c.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/rto/${c.id}` })}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium font-mono text-sm">
                            {c.leaseAgreement?.property?.propertyCode ?? c.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">#{c.id.slice(0, 8)}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{tenantDisplayName(c)}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.leaseAgreement?.tenant?.email ?? "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{propertyDisplayName(c)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-yellow-700">{money(c.accumulatedEquity)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{c.targetPurchaseDate ? new Date(c.targetPurchaseDate).toLocaleDateString() : "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: `/rto/${c.id}` });
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}



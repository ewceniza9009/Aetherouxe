import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/agent-meta";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import {
  useRtoContracts,
  useCheckDefault,
  tenantDisplayName,
  propertyDisplayName,
  type RtoContract,
  type RtoQuery,
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const query: RtoQuery = useMemo(
    () => ({
      page,
      limit: 10,
      status: statusFilter !== "all" ? (statusFilter as RtoStatus) : undefined,
    }),
    [page, statusFilter]
  );

  const { data, isLoading, isError, refetch } = useRtoContracts(query);
  const checkDefault = useCheckDefault();

  const contracts = data?.data ?? [];

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

  const columnHelper = createColumnHelper<RtoContract>();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "code",
        header: "Contract",
        cell: (info) => {
          const c = info.row.original;
          return (
            <div>
              <div className="font-medium font-mono text-sm">
                {c.leaseAgreement?.property?.propertyCode ?? c.id.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">#{c.id.slice(0, 8)}</div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "tenant",
        header: "Buyer",
        cell: (info) => {
          const c = info.row.original;
          return (
            <div>
              <div className="font-medium">{tenantDisplayName(c)}</div>
              <div className="text-xs text-muted-foreground">
                {c.leaseAgreement?.tenant?.email ?? "—"}
              </div>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "property",
        header: "Property",
        cell: (info) => <span className="text-sm">{propertyDisplayName(info.row.original)}</span>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>;
        },
      }),
      columnHelper.accessor("accumulatedEquity", {
        header: "Accumulated Equity",
        cell: (info) => (
          <span className="text-sm font-semibold text-yellow-700">{money(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor("targetPurchaseDate", {
        header: "Target Purchase",
        cell: (info) => {
          const v = info.getValue();
          return <span className="text-sm">{v ? new Date(v).toLocaleDateString() : "—"}</span>;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: `/rto/${info.row.original.id}` });
            }}
          >
            View
          </Button>
        ),
      }),
    ],
    [columnHelper, navigate]
  );

  const table = useReactTable({
    data: contracts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent" /> RTO Contracts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
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
          </div>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load RTO contracts.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <KeyRound className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No rent-to-own contracts found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border scroll-grid">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b bg-muted/50">
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate({ to: `/rto/${row.original.id}` })}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {meta?.total ?? 0} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

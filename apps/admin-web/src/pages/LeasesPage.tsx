import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type FilterFn,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ChevronLeft, ChevronRight, AlertCircle, FileText } from "lucide-react";
import { LeaseType } from "@elite-realty/shared-types";
import {
  useLeases,
  type Lease,
  type LeaseQuery,
  type LeaseStatus,
} from "@/hooks/use-leases";
import { formatCurrency } from "@/lib/agent-meta";

const statusVariant: Record<LeaseStatus, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  active: "success",
  rto_active: "success",
  pending: "warning",
  expiring: "warning",
  rto_delinquent: "warning",
  expired: "secondary",
  rto_converted: "secondary",
  terminated: "destructive",
};

const statusLabel: Record<LeaseStatus, string> = {
  active: "Active",
  rto_active: "RTO Active",
  pending: "Pending",
  expiring: "Expiring",
  rto_delinquent: "RTO Delinquent",
  expired: "Expired",
  rto_converted: "RTO Converted",
  terminated: "Terminated",
};

const globalFilterFn: FilterFn<Lease> = (row, _columnId, filterValue) => {
  const search = String(filterValue).toLowerCase();
  const lease = row.original;
  return (
    lease.tenantName.toLowerCase().includes(search) ||
    lease.tenantEmail.toLowerCase().includes(search) ||
    lease.propertyName?.toLowerCase().includes(search) === true
  );
};

export default function LeasesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const query: LeaseQuery = useMemo(
    () => ({
      page,
      limit: 10,
      sort: "createdAt",
      order: "desc",
      search: search || undefined,
      type: typeFilter !== "all" ? (typeFilter as LeaseType) : undefined,
      status: statusFilter !== "all" ? (statusFilter as LeaseStatus) : undefined,
    }),
    [page, search, typeFilter, statusFilter]
  );

  const { data, isLoading, isError, refetch } = useLeases(query);

  const columnHelper = createColumnHelper<Lease>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("tenantName", {
        header: "Tenant",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium text-sm">{info.row.original.tenantName}</div>
              <div className="text-xs text-muted-foreground">{info.row.original.tenantEmail}</div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("propertyName", {
        header: "Property",
        cell: (info) => <span className="text-sm">{info.getValue() ?? "—"}</span>,
      }),
      columnHelper.accessor("leaseType", {
        header: "Type",
        cell: (info) => (
          <Badge variant="outline">
            {info.getValue().replace(/_/g, " ")}
          </Badge>
        ),
      }),
      columnHelper.accessor("startDate", {
        header: "Start",
        cell: (info) => <span className="text-sm">{new Date(info.getValue()).toLocaleDateString()}</span>,
      }),
      columnHelper.accessor("endDate", {
        header: "End",
        cell: (info) => <span className="text-sm">{new Date(info.getValue()).toLocaleDateString()}</span>,
      }),
      columnHelper.accessor("monthlyRent", {
        header: "Monthly Rent",
        cell: (info) => (
          <span className="text-sm font-medium">
            {formatCurrency(Number(info.getValue()))}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>;
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
              navigate({ to: `/leases/${info.row.original.id}` });
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
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter: search,
    },
    onGlobalFilterChange: setSearch,
    globalFilterFn,
  });

  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
          <p className="text-muted-foreground">Manage lease contracts and RTO agreements</p>
        </div>
        <Button onClick={() => navigate({ to: "/leases/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Lease
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leases..."
                className="pl-9 bg-transparent"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Lease Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={LeaseType.StandardRental}>Standard Rental</SelectItem>
                  <SelectItem value={LeaseType.RentToOwn}>Rent to Own</SelectItem>
                  <SelectItem value={LeaseType.CorporateLease}>Corporate Lease</SelectItem>
                  <SelectItem value={LeaseType.ShortTerm}>Short Term</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="rto_active">RTO Active</SelectItem>
                  <SelectItem value="rto_delinquent">RTO Delinquent</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load leases.</p>
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
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">No leases found.</p>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/leases/new" })}>
                <Plus className="mr-2 h-4 w-4" /> Create a Lease
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border scroll-grid">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b bg-muted/50">
                        {hg.headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
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
                        onClick={() => navigate({ to: `/leases/${row.original.id}` })}
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

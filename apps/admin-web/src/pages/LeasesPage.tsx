import { useMemo, useState } from "react";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { useNavigate } from "@tanstack/react-router";
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
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { LeaseType } from "@elite-realty/shared-types";
import {
  useLeases,
  useTerminateLease,
  type Lease,
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

export default function LeasesPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fullQuery = useMemo(
    () => ({
      ...query,
      type: typeFilter !== "all" ? (typeFilter as LeaseType) : undefined,
      status: statusFilter !== "all" ? (statusFilter as LeaseStatus) : undefined,
    }),
    [query, typeFilter, statusFilter]
  );

  const { data, isLoading, isError, refetch } = useLeases(fullQuery);
  const terminateLease = useTerminateLease();

  const leases = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lease Agreements</h1>
          <p className="text-muted-foreground">Manage lease contracts and RTO agreements</p>
        </div>
        <Button onClick={() => navigate({ to: "/leases/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Lease
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search leases…"
        filters={
          <>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
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
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
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
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={leases.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tenant</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Property</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th {...sortHeader("startDate", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Start{sortIndicator("startDate")}
                    </th>
                    <th {...sortHeader("endDate", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      End{sortIndicator("endDate")}
                    </th>
                    <th {...sortHeader("monthlyRentAmount", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Monthly Rent{sortIndicator("monthlyRentAmount")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leases.map((l: Lease) => (
                    <tr
                      key={l.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/leases/${l.id}` })}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{l.tenantName}</div>
                            <div className="text-xs text-muted-foreground">{l.tenantEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{l.propertyName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {l.leaseType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(Number(l.monthlyRent))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[l.status]}>{statusLabel[l.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/leases/${l.id}/edit` });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("Terminate this lease? This cannot be undone.")) {
                                await terminateLease.mutateAsync({ id: l.id });
                                refetch();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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



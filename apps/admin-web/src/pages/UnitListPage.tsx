import { useState, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@elite-realty/shared-ui/components/ui";
import { ArrowLeft, Plus, Eye, Trash2 } from "lucide-react";
import { useUnits, useDeleteUnit, type Unit } from "@/hooks/use-units";
import { useProperty } from "@/hooks/use-properties";
import { formatCurrency } from "@/lib/agent-meta";

export default function UnitListPage() {
  const { propertyId } = useParams({ from: "/protected/properties/$propertyId/units" });
  const navigate = useNavigate();
  const { data: property } = useProperty(propertyId);
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const fullQuery = useMemo(() => ({
    ...query,
    propertyId,
    type: typeFilter !== "all" ? typeFilter : undefined,
  }), [query, propertyId, typeFilter]);

  const { data: result, isLoading, isError, refetch } = useUnits(fullQuery);
  const deleteUnit = useDeleteUnit();

  const units = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: `/properties/${propertyId}` })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {property ? `${property.name} - Units` : "Units"}
            </h1>
            <p className="text-muted-foreground">Manage units in this property</p>
          </div>
        </div>
        <Button onClick={() => navigate({ to: `/properties/${propertyId}/units/new` })}>
          <Plus className="mr-2 h-4 w-4" /> New Unit
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search units…"
        filters={
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Unit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="one_br">1 BR</SelectItem>
              <SelectItem value="two_br">2 BR</SelectItem>
              <SelectItem value="three_br">3 BR</SelectItem>
              <SelectItem value="penthouse">Penthouse</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={units.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("unitNumber", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Unit Number{sortIndicator("unitNumber")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th {...sortHeader("squareMeters", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Size{sortIndicator("squareMeters")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Bed</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Bath</th>
                    <th {...sortHeader("listPrice", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      List Price{sortIndicator("listPrice")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u: Unit) => {
                    const status = u.status;
                    const variant = status === "occupied" ? "success" : status === "available" ? "default" : "secondary";
                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{u.unitNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{u.type || "--"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {u.size ? <span>{u.size} sq ft</span> : <span className="text-muted-foreground">--</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">{u.bedrooms ?? "--"}</td>
                        <td className="px-4 py-3 text-sm">{u.bathrooms ?? "--"}</td>
                        <td className="px-4 py-3 text-sm">
                          {u.listPrice ? <span className="tabular-nums">{formatCurrency(u.listPrice)}</span> : <span className="text-muted-foreground">--</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={variant as any}>{status || "unknown"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/properties/${propertyId}/units/${u.id}/edit` });
                            }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(u);
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteTarget) return;
              await deleteUnit.mutateAsync(deleteTarget.id);
              setDeleteDialogOpen(false);
              setDeleteTarget(null);
            }} disabled={deleteUnit.isPending}>
              {deleteUnit.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



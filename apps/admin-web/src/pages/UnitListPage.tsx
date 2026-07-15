import { useState, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useUnits, useDeleteUnit, type Unit, type UnitQuery } from "@/hooks/use-units";
import { useProperty } from "@/hooks/use-properties";

export default function UnitListPage() {
  const { propertyId } = useParams({ from: "/protected/properties/$propertyId/units" });
  const navigate = useNavigate();
  const { data: property } = useProperty(propertyId);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const limit = 10;

  const query: UnitQuery = useMemo(() => ({
    page,
    limit,
    propertyId,
    type: typeFilter !== "all" ? typeFilter : undefined,
  }), [page, propertyId, typeFilter]);

  const { data: result, isLoading, error } = useUnits(query);
  const deleteUnit = useDeleteUnit();

  const columns = useMemo<ColumnDef<Unit>[]>(
    () => [
      {
        accessorKey: "unitNumber",
        header: "Unit Number",
        cell: ({ row }) => <span className="font-mono font-medium">{row.getValue("unitNumber")}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return <Badge variant="secondary">{type || "--"}</Badge>;
        },
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => {
          const size = row.getValue("size") as number;
          return size ? <span>{size} sq ft</span> : <span className="text-muted-foreground">--</span>;
        },
      },
      {
        accessorKey: "bedrooms",
        header: "Bed",
        cell: ({ row }) => <span>{row.getValue("bedrooms") ?? "--"}</span>,
      },
      {
        accessorKey: "bathrooms",
        header: "Bath",
        cell: ({ row }) => <span>{row.getValue("bathrooms") ?? "--"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const variant = status === "occupied" ? "success" : status === "available" ? "default" : "secondary";
          return <Badge variant={variant as any}>{status || "unknown"}</Badge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation();
              navigate({ to: `/properties/${propertyId}/units/${row.original.id}/edit` });
            }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row.original);
              setDeleteDialogOpen(true);
            }}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate, propertyId]
  );

  const data = useMemo(() => result?.data ?? [], [result]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: result?.meta?.totalPages ?? 1,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/properties/${propertyId}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-red-500">
            <p className="text-lg font-semibold">Failed to load units</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Units</CardTitle>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36">
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-muted-foreground">No units found</p>
              <p className="text-sm text-muted-foreground">Create your first unit for this property.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b hover:bg-muted/30 transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {result?.meta
                    ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, result.meta.total)} of ${result.meta.total} units`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {result?.meta && Array.from({ length: result.meta.totalPages }, (_, i) => (
                    <Button key={i} variant={page === i + 1 ? "default" : "outline"} size="sm" onClick={() => setPage(i + 1)}>
                      {i + 1}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!result?.meta || page >= result.meta.totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
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

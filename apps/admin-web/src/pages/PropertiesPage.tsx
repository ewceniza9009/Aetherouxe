import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useNavigate } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Building2,
} from "lucide-react";
import { useProperties, useDeleteProperty, type Property, type PropertyQuery } from "@/hooks/use-properties";
import { useProjects } from "@/hooks/use-projects";
import { PropertyType, PropertyStatus } from "@elite-realty/shared-types";

export default function PropertiesPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const limit = 10;
  const debouncedSearch = useDebouncedValue(search, 350);

  const query: PropertyQuery = useMemo(() => {
    const sortField = sorting[0];
    return {
      page,
      limit,
      sort: sortField?.id === "name" ? "code" : sortField?.id,
      order: sortField?.desc ? "desc" : "asc",
      search: debouncedSearch || undefined,
      type: typeFilter !== "all" ? (typeFilter as PropertyType) : undefined,
      status: statusFilter !== "all" ? (statusFilter as PropertyStatus) : undefined,
      projectId: projectFilter !== "all" ? projectFilter : undefined,
    };
  }, [page, debouncedSearch, typeFilter, statusFilter, projectFilter, sorting]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: result, isLoading, error } = useProperties(query);
  const { data: projectsResult } = useProjects({ limit: 200 });
  const projects = projectsResult?.data ?? [];
  const deleteProperty = useDeleteProperty();

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteProperty.mutateAsync(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, deleteProperty]);

  const columns = useMemo<ColumnDef<Property>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Property Code",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <span className="font-mono text-xs font-medium">{row.getValue("code")}</span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return <Badge variant="secondary">{type.replace(/_/g, " ")}</Badge>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const variant =
            status === "rented"
              ? "success"
              : status === "available"
                ? "default"
                : status === "under_maintenance"
                  ? "warning"
                  : "secondary";
          return <Badge variant={variant as any}>{status.replace(/_/g, " ")}</Badge>;
        },
      },
      {
        accessorKey: "name",
        header: "Building",
        cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
      },
      {
        accessorKey: "projectName",
        header: "Project",
        cell: ({ row }) => {
          const projectName = row.original.projectName;
          return projectName ? (
            <span className="text-sm text-muted-foreground">{projectName}</span>
          ) : (
            <span className="text-sm text-muted-foreground/50">—</span>
          );
        },
      },
      {
        accessorKey: "units",
        header: "Units",
        cell: ({ row }) => <span>{row.getValue("units")}</span>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate({ to: `/properties/${row.original.id}` });
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const data = useMemo(() => result?.data ?? [], [result]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: result?.meta?.totalPages ?? 1,
  });

  if (error) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-500">
              <p className="text-lg font-semibold">Failed to load properties</p>
              <p className="text-sm text-muted-foreground">Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your property portfolio</p>
        </div>
        <Button onClick={() => navigate({ to: "/properties/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Property
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-transparent"
              />
            </div>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(PropertyType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(PropertyStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={projectFilter}
                onValueChange={(v) => {
                  setProjectFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-muted-foreground">No properties found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border scroll-grid">
                <table className="w-full">
                  <thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
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
                        onClick={() => navigate({ to: `/properties/${row.original.id}` })}
                      >
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
                    ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, result.meta.total)} of ${result.meta.total} properties`
                    : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {result?.meta &&
                    Array.from({ length: result.meta.totalPages }, (_, i) => (
                      <Button
                        key={i}
                        variant={page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!result?.meta || page >= result.meta.totalPages}
                  >
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
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProperty.isPending}>
              {deleteProperty.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

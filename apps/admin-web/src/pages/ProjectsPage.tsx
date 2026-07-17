import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Plus, Search, MapPin, SearchX, CheckCircle2, ChevronRight, ExternalLink, Calendar, Building2, Hammer, ArrowUpDown, Eye } from "lucide-react";
import { useProjects, useDeleteProject, projectTypeLabels, projectStatusLabels } from "@/hooks/use-projects";
import type { Project, ProjectType, ProjectStatus } from "@/hooks/use-projects";

const statusVariant: Record<ProjectStatus, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  planning: "secondary",
  pre_selling: "warning",
  construction: "default",
  fit_out: "default",
  completed: "success",
  turnover: "success",
};

const projectTypeOptions = Object.keys(projectTypeLabels) as ProjectType[];
const projectStatusOptions = Object.keys(projectStatusLabels) as ProjectStatus[];

const columnHelper = createColumnHelper<Project>();

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const query = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as ProjectStatus) : undefined,
    projectType: typeFilter !== "all" ? (typeFilter as ProjectType) : undefined,
  }), [pagination.pageIndex, pagination.pageSize, search, statusFilter, typeFilter]);

  const { data, isLoading, isError } = useProjects(query);
  const deleteProject = useDeleteProject();

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {info.row.original.address || "No address provided"}
            </div>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("projectType", {
      header: "Type",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {projectTypeLabels[info.getValue()]}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge variant={statusVariant[info.getValue()]}>
          {info.getValue().replace(/_/g, " ")}
        </Badge>
      ),
    }),
    columnHelper.accessor("totalPhases", {
      header: "Phases",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">{info.getValue() ?? 0}</span>
      ),
    }),
    columnHelper.accessor("targetCompletionDate", {
      header: "Target Completion",
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-sm">
            {v ? new Date(v).toLocaleDateString() : "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); navigate({ to: `/projects/${row.original.id}` }); }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    }),
  ], [navigate]);

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    pageCount: data?.meta?.totalPages ?? -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Development Projects</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive font-medium">Failed to load projects</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Development Projects</h1>
          <p className="text-muted-foreground">Track construction and development progress</p>
        </div>
        <Button onClick={() => navigate({ to: "/projects/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-transparent"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {projectStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{projectStatusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{projectTypeLabels[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (data?.data ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Hammer className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No projects found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Get started by creating your first project."}
              </p>
              {!search && statusFilter === "all" && typeFilter === "all" && (
                <Button className="mt-4" onClick={() => navigate({ to: "/projects/new" })}>
                  <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
              )}
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
                            className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                          >
                            {header.isPlaceholder ? null : (
                              <span className="flex items-center gap-1">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <ArrowUpDown className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate({ to: `/projects/${row.original.id}` })}
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
                <span className="text-sm text-muted-foreground">
                  {data?.meta?.total ?? 0} total projects
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.pageIndex + 1} of {table.getPageCount()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
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

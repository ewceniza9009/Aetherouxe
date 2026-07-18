import { useState, useMemo, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@elite-realty/shared-ui/components/ui";
import {
  Plus,
  Eye,
  Trash2,
  Building2,
} from "lucide-react";
import { useProperties, useDeleteProperty, type Property } from "@/hooks/use-properties";
import { useProjects } from "@/hooks/use-projects";
import { PropertyType, PropertyStatus } from "@elite-realty/shared-types";

export default function PropertiesPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const fullQuery = useMemo(
    () => ({
      ...query,
      type: typeFilter !== "all" ? (typeFilter as PropertyType) : undefined,
      status: statusFilter !== "all" ? (statusFilter as PropertyStatus) : undefined,
      projectId: projectFilter !== "all" ? projectFilter : undefined,
    }),
    [query, typeFilter, statusFilter, projectFilter]
  );

  const { data, isLoading, isError, refetch } = useProperties(fullQuery);
  const { data: projectsResult } = useProjects({ limit: 200 });
  const projects = projectsResult?.data ?? [];
  const deleteProperty = useDeleteProperty();

  const properties = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteProperty.mutateAsync(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, deleteProperty]);

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your property portfolio</p>
        </div>
        <Button onClick={() => navigate({ to: "/properties/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Property
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search properties…"
        filters={
          <>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
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
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
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
            <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); resetPage(); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
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
            isEmpty={properties.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("propertyCode", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Property Code{sortIndicator("propertyCode")}
                    </th>
                    <th {...sortHeader("propertyType", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Type{sortIndicator("propertyType")}
                    </th>
                    <th {...sortHeader("status", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("status")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Building</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Units</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p: Property) => (
                    <tr
                      key={p.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/properties/${p.id}` })}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-mono text-xs font-medium">{p.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{p.type.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const variant =
                            p.status === "rented"
                              ? "success"
                              : p.status === "available"
                                ? "default"
                                : p.status === "under_maintenance"
                                  ? "warning"
                                  : "secondary";
                          return <Badge variant={variant as any}>{p.status.replace(/_/g, " ")}</Badge>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-sm">
                        {p.projectName ? (
                          <span className="text-muted-foreground">{p.projectName}</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{p.units}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/properties/${p.id}` });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(p);
                              setDeleteDialogOpen(true);
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



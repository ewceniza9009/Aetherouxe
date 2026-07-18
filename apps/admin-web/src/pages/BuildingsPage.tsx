import { useState, useMemo, useCallback } from "react";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Plus,
  Eye,
  Trash2,
  Layers,
  Building as BuildingIcon,
} from "lucide-react";
import { useBuildings, useDeleteBuilding, type Building } from "@/hooks/use-buildings";

export default function BuildingsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [projectFilter, setProjectFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);

  const fullQuery = useMemo(
    () => ({
      ...query,
      projectId: projectFilter !== "all" ? projectFilter : undefined,
    }),
    [query, projectFilter]
  );

  const { data, isLoading, isError, refetch } = useBuildings(fullQuery);
  const deleteBuilding = useDeleteBuilding();

  const buildings = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteBuilding.mutateAsync(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, deleteBuilding]);

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buildings</h1>
          <p className="text-muted-foreground">Manage building records</p>
        </div>
        <Button onClick={() => navigate({ to: "/buildings/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Building
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search buildings…"
        filters={
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); resetPage(); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={buildings.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("name", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Name{sortIndicator("name")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th {...sortHeader("floorCount", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Floors{sortIndicator("floorCount")}
                    </th>
                    <th {...sortHeader("unitCount", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Units{sortIndicator("unitCount")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map((b: Building) => (
                    <tr
                      key={b.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/buildings/${b.id}/floors` })}
                    >
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <BuildingIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{b.type.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{b.floorCount}</td>
                      <td className="px-4 py-3 text-sm">{b.units}</td>
                      <td className="px-4 py-3 text-sm">
                        {b.projectName ? (
                          <span>{b.projectName}</span>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/buildings/${b.id}/floors` });
                            }}
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/buildings/${b.id}/edit` });
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(b);
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
            <DialogTitle>Delete Building</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBuilding.isPending}>
              {deleteBuilding.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

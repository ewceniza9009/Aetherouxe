import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
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
import { Plus, MapPin, Building2, Eye } from "lucide-react";
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

export default function ProjectsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fullQuery = useMemo(() => ({
    ...query,
    status: statusFilter !== "all" ? (statusFilter as ProjectStatus) : undefined,
    projectType: typeFilter !== "all" ? (typeFilter as ProjectType) : undefined,
  }), [query, statusFilter, typeFilter]);

  const { data, isLoading, isError, refetch } = useProjects(fullQuery);
  const deleteProject = useDeleteProject();

  const projects = data?.data ?? [];
  const meta = data?.meta;

  if (isError) {
    return (
      <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
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

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search projects…"
        filters={
          <>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {projectStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{projectStatusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {projectTypeOptions.map((t) => (
                  <SelectItem key={t} value={t}>{projectTypeLabels[t]}</SelectItem>
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
            isEmpty={projects.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("name", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Name{sortIndicator("name")}
                    </th>
                    <th {...sortHeader("projectType", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Type{sortIndicator("projectType")}
                    </th>
                    <th {...sortHeader("status", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("status")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Phases</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Target Completion</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p: Project) => (
                    <tr
                      key={p.id}
                      className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate({ to: `/projects/${p.id}` })}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {p.address || "No address provided"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{projectTypeLabels[p.projectType]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[p.status]}>
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.totalPhases ?? 0}</td>
                      <td className="px-4 py-3 text-sm">
                        {p.targetCompletionDate ? new Date(p.targetCompletionDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); navigate({ to: `/projects/${p.id}` }); }}
                          >
                            <Eye className="h-4 w-4" />
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

import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Hammer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
} from "lucide-react";
import { useProject, useProjectTimeline, useDeleteProject } from "@/hooks/use-projects";
import { usePhases } from "@/hooks/use-phases";
import { useBudgets } from "@/hooks/use-budgets";
import type { ProjectStatus, ProjectType } from "@/hooks/use-projects";

const statusVariant: Record<ProjectStatus, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  planning: "secondary",
  in_progress: "default",
  delayed: "destructive",
  completed: "success",
  cancelled: "warning",
};

const projectTypeLabels: Record<ProjectType, string> = {
  land_development: "Land Development",
  new_construction: "New Construction",
  renovation: "Renovation",
  maintenance: "Maintenance",
};

function getHealthColor(pct: number) {
  if (pct <= 100) return "bg-green-500";
  if (pct <= 120) return "bg-yellow-500";
  return "bg-red-500";
}

function getHealthTextColor(pct: number) {
  if (pct <= 100) return "text-green-600";
  if (pct <= 120) return "text-yellow-600";
  return "text-red-600";
}

export default function ProjectDetailPage() {
  const { id } = useParams({ from: "/protected/projects/$id" });
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const { data: project, isLoading, isError } = useProject(id);
  const { data: timeline } = useProjectTimeline(id);
  const { data: phases } = usePhases(id);
  const { data: budgetsData } = useBudgets({ projectId: id });
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    await deleteProject.mutateAsync(id);
    navigate({ to: "/projects" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/projects" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Project not found</p>
            <p className="text-sm text-muted-foreground mt-1">This project may have been removed.</p>
            <Button className="mt-4" variant="outline" onClick={() => navigate({ to: "/projects" })}>
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const budgetList = budgetsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/projects" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {project.logoUrl && (
              <img src={project.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant={statusVariant[project.status]}>
                  {project.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-muted-foreground">{projectTypeLabels[project.projectType]}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: `/projects/${id}/edit` })}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteProject.isPending}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab} className="space-y-4">
        <Tabs.List className="flex border-b">
          <Tabs.Trigger
            value="overview"
            className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors"
          >
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="phases"
            className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors"
          >
            Phases
          </Tabs.Trigger>
          <Tabs.Trigger
            value="budgets"
            className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors"
          >
            Budgets
          </Tabs.Trigger>
          <Tabs.Trigger
            value="timeline"
            className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors"
          >
            Timeline
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{project.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target End</p>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {project.address || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="font-medium mt-1">{project.completionPercentage}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    project.status === "completed" ? "bg-green-500" :
                    project.status === "delayed" ? "bg-red-500" : "bg-primary"
                  }`}
                  style={{ width: `${project.completionPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {project.totalBudget ? `$${project.totalBudget.toLocaleString()}` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {project.totalSpent ? `$${project.totalSpent.toLocaleString()}` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{phases?.length ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        <Tabs.Content value="phases" className="space-y-4">
          {!phases || phases.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">No phases defined yet</p>
              </CardContent>
            </Card>
          ) : (
            phases.map((phase) => (
              <Card key={phase.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{phase.name}</h3>
                      <Badge
                        variant={
                          phase.status === "completed" ? "success" :
                          phase.status === "in_progress" ? "default" :
                          phase.status === "delayed" ? "destructive" : "secondary"
                        }
                      >
                        {phase.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {phase.startDate ? new Date(phase.startDate).toLocaleDateString() : "—"} — {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  {phase.description && (
                    <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          phase.status === "completed" ? "bg-green-500" :
                          phase.status === "delayed" ? "bg-red-500" : "bg-primary"
                        }`}
                        style={{ width: `${phase.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{phase.progress}%</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </Tabs.Content>

        <Tabs.Content value="budgets" className="space-y-4">
          {budgetList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">No budgets created yet</p>
              </CardContent>
            </Card>
          ) : (
            budgetList.map((budget) => {
              const pct = budget.totalPlanned > 0
                ? (budget.totalActual / budget.totalPlanned) * 100
                : 0;
              return (
                <Card
                  key={budget.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate({ to: `/projects/${id}/budgets/${budget.id}` })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{budget.name}</h3>
                        <p className="text-xs text-muted-foreground">v{budget.version}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className={`h-3 w-3 rounded-full ${
                            pct <= 100 ? "bg-green-500" :
                            pct <= 120 ? "bg-yellow-500" : "bg-red-500"
                          }`} />
                          <Badge variant={
                            budget.status === "approved" ? "success" :
                            budget.status === "active" ? "default" : "secondary"
                          }>
                            {budget.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Planned</p>
                        <p className="font-medium">${budget.totalPlanned.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual</p>
                        <p className="font-medium">${budget.totalActual.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Variance</p>
                        <p className={`font-medium ${pct <= 100 ? "text-green-600" : "text-red-600"}`}>
                          {pct > 0 ? `${(pct - 100).toFixed(1)}%` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getHealthColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Tabs.Content>

        <Tabs.Content value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {!timeline || timeline.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">No timeline data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((entry) => {
                    const start = new Date(entry.startDate);
                    const end = new Date(entry.endDate);
                    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                    const elapsedDays = totalDays * (entry.progress / 100);
                    const pctWidth = Math.max((elapsedDays / totalDays) * 100, entry.progress);

                    return (
                      <div key={entry.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{entry.phaseName}</span>
                            <Badge variant={
                              entry.status === "completed" ? "success" :
                              entry.status === "in_progress" ? "default" :
                              entry.status === "delayed" ? "destructive" : "secondary"
                            }>
                              {entry.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {start.toLocaleDateString()} — {end.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-md ${
                              entry.status === "completed" ? "bg-green-500" :
                              entry.status === "delayed" ? "bg-red-500" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(pctWidth, 100)}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">
                            {entry.progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

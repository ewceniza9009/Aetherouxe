import { useParams, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MapPin,
  Hammer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useProject, useProjectTimeline, useBudgetHealth, type ProjectStatus } from "@/hooks/use-projects";

const statusVariant: Record<ProjectStatus, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  planning: "secondary",
  in_progress: "default",
  delayed: "destructive",
  completed: "success",
  cancelled: "warning",
};

const statusIcon: Record<ProjectStatus, React.ReactNode> = {
  planning: <Clock className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-blue-600" />,
  delayed: <AlertTriangle className="h-4 w-4 text-red-600" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  cancelled: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
};

function GanttRow({ name, start, end, status }: { name: string; start?: string; end?: string; status: string }) {
  const parse = (d?: string) => (d ? new Date(d).getTime() : null);
  const s = parse(start) ?? Date.now();
  const e = parse(end) ?? Date.now() + 86400000 * 30;
  const duration = Math.max((e - s) / (1000 * 60 * 60 * 24), 1);
  const color =
    status === "completed"
      ? "bg-green-500"
      : status === "delayed"
        ? "bg-red-500"
        : status === "in_progress"
          ? "bg-primary"
          : "bg-muted-foreground/40";
  return (
    <div className="grid grid-cols-4 gap-3 items-center py-2">
      <span className="text-sm font-medium truncate">{name}</span>
      <span className="text-xs text-muted-foreground">{duration}d</span>
      <div className="col-span-2">
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min((duration / 365) * 100, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function OwnerProjectDetailPage() {
  const { projectId } = useParams({ strict: false }) as { projectId: string };
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(projectId);
  const { data: timeline } = useProjectTimeline(projectId);
  const { data: budgetHealth } = useBudgetHealth(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate({ to: "/projects" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">Project not found</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: "/projects" })}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
      </Button>

      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            {project.projectLogoUrl ? (
              <img src={project.projectLogoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <Hammer className="h-7 w-7 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              {project.address && <><MapPin className="h-4 w-4" /> {project.address}</>}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[project.status]}>
          <span className="flex items-center gap-1">
            {statusIcon[project.status]}
            {project.status.replace(/_/g, " ")}
          </span>
        </Badge>
      </div>

      {/* Completion + Budget summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.completionPercentage}%</div>
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full ${
                  project.status === "completed" ? "bg-green-500" : project.status === "delayed" ? "bg-red-500" : "bg-primary"
                }`}
                style={{ width: `${project.completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Budget Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgetHealth ? (
              <>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      budgetHealth.healthScore === "green"
                        ? "bg-green-500"
                        : budgetHealth.healthScore === "yellow"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="text-lg font-bold capitalize">{budgetHealth.healthScore}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Variance {budgetHealth.variancePercentage}%
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No budget data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Projected ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.projectedROI ? `${project.projectedROI}%` : "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Timeline (Gantt) */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline && timeline.phases.length > 0 ? (
            <div className="divide-y">
              {timeline.phases.map((p) => (
                <GanttRow key={p.id} name={p.phaseName} start={p.targetStart ?? undefined} end={p.targetEnd ?? undefined} status={p.status} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No phases defined yet.</p>
          )}
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            Target: {project.targetStartDate ? new Date(project.targetStartDate).toLocaleDateString() : "TBD"} →{" "}
            {project.targetCompletionDate ? new Date(project.targetCompletionDate).toLocaleDateString() : "TBD"}
          </p>
        </CardContent>
      </Card>

      {/* Budget breakdown */}
      {budgetHealth && budgetHealth.plannedVsActual.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown (Planned vs Actual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgetHealth.plannedVsActual.map((b, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{b.category.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">
                    ${b.actual.toLocaleString()} / ${b.planned.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      b.actual > b.planned ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min((b.actual / Math.max(b.planned, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

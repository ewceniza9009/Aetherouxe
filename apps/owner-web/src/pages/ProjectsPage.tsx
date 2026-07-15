import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import {
  Hammer,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import type { ProjectStatus } from "@/hooks/use-projects";

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

function HealthDot(project: { totalBudget?: number; totalSpent?: number }) {
  if (!project.totalBudget || !project.totalSpent) {
    return <div className="h-3 w-3 rounded-full bg-gray-300" />;
  }
  const pct = (project.totalSpent / project.totalBudget) * 100;
  const color = pct <= 100 ? "bg-green-500" : pct <= 120 ? "bg-yellow-500" : "bg-red-500";
  return <div className={`h-3 w-3 rounded-full ${color}`} />;
}

export default function OwnerProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading, isError } = useProjects({ limit: 50 });

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Development Projects</h1>
          <p className="text-muted-foreground">Track project milestones and completion timelines</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Failed to load projects</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Development Projects</h1>
        <p className="text-muted-foreground">Track project milestones and completion timelines</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Hammer className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">No development projects yet</p>
            <p className="text-sm text-muted-foreground mt-1">Projects will appear here once created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30"
              onClick={() => navigate({ to: `/projects/${project.id}` })}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      {project.projectLogoUrl ? (
                        <img src={project.projectLogoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <Hammer className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {project.projectType.replace(/_/g, " ")}
                      </p>
                      {project.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {project.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={statusVariant[project.status]}>
                      <span className="flex items-center gap-1">
                        {statusIcon[project.status]}
                        {project.status.replace(/_/g, " ")}
                      </span>
                    </Badge>
                    <HealthDot {...project} />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{project.completionPercentage}%</span>
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
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm pt-3 border-t">
                  <div>
                    <p className="text-muted-foreground text-xs">Budget</p>
                    <p className="font-medium">
                      {project.totalBudget ? `$${(project.totalBudget / 1000000).toFixed(1)}M` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Spent</p>
                    <p className="font-medium">
                      {project.totalSpent ? `$${(project.totalSpent / 1000000).toFixed(1)}M` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">ROI</p>
                    <p className="font-medium">
                      {project.projectedROI ? `${project.projectedROI}%` : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end mt-3 text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useProject, useUpdateProject, projectTypeLabels, projectStatusLabels } from "@/hooks/use-projects";
import type { ProjectType, ProjectStatus } from "@/hooks/use-projects";

const projectTypes = (Object.keys(projectTypeLabels) as ProjectType[]).map((value) => ({ value, label: projectTypeLabels[value] }));
const statuses = (Object.keys(projectStatusLabels) as ProjectStatus[]).map((value) => ({ value, label: projectStatusLabels[value] }));

export default function EditProjectPage() {
  const { projectId: id } = useParams({ from: "/protected/projects/$projectId/edit" });
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject();

  const [form, setForm] = useState({
    name: "",
    projectType: "" as string,
    status: "planning" as string,
    description: "",
    targetStartDate: "",
    targetCompletionDate: "",
    address: "",
    projectLogoUrl: "",
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || "",
        projectType: project.projectType || "",
        status: project.status || "planning",
        description: project.description || "",
        targetStartDate: project.targetStartDate ? project.targetStartDate.split("T")[0] : "",
        targetCompletionDate: project.targetCompletionDate ? project.targetCompletionDate.split("T")[0] : "",
        address: project.address || "",
        projectLogoUrl: project.projectLogoUrl || "",
      });
    }
  }, [project]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = undefined;
    });
    await updateProject.mutateAsync({ id, ...payload } as any);
    navigate({ to: `/projects/${id}` });
  };

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/projects" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Project not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/projects/${id}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select value={form.projectType} onValueChange={(v) => update("projectType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule & Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetStartDate">Target Start Date</Label>
                    <Input id="targetStartDate" type="date" value={form.targetStartDate} onChange={(e) => update("targetStartDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetCompletionDate">Target Completion Date</Label>
                    <Input id="targetCompletionDate" type="date" value={form.targetCompletionDate} onChange={(e) => update("targetCompletionDate", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectLogoUrl">Logo URL</Label>
                  <Input id="projectLogoUrl" value={form.projectLogoUrl} onChange={(e) => update("projectLogoUrl", e.target.value)} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate({ to: `/projects/${id}` })}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProject.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateProject.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

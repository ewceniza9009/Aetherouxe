import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Textarea } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateProject, projectTypeLabels, projectStatusLabels } from "@/hooks/use-projects";
import type { ProjectType, ProjectStatus } from "@/hooks/use-projects";

function getTenantId(): string {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.tenantId) return parsed.tenantId;
    }
  } catch {
    // ignore
  }
  return "";
}

const projectTypes = (Object.keys(projectTypeLabels) as ProjectType[]).map((value) => ({ value, label: projectTypeLabels[value] }));
const statuses = (Object.keys(projectStatusLabels) as ProjectStatus[]).map((value) => ({ value, label: projectStatusLabels[value] }));

export default function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();

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

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form, tenantId: getTenantId() };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = undefined;
    });
    const project = await createProject.mutateAsync(payload as any);
    navigate({ to: `/projects/${project.id}` });
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/projects" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground">Create a new development or construction project</p>
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
                <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="e.g. Pine Valley Ranch" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Type *</Label>
                  <Select value={form.projectType} onValueChange={(v) => update("projectType", v)} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
                <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Project description..." />
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
                  <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St, City" />
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
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/projects" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}



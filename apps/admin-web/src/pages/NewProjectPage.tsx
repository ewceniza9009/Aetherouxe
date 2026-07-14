import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateProject } from "@/hooks/use-projects";
import type { ProjectType, ProjectStatus } from "@/hooks/use-projects";

const projectTypes: { value: ProjectType; label: string }[] = [
  { value: "land_development", label: "Land Development" },
  { value: "new_construction", label: "New Construction" },
  { value: "renovation", label: "Renovation" },
  { value: "maintenance", label: "Maintenance" },
];

const statuses: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "delayed", label: "Delayed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  const [form, setForm] = useState({
    name: "",
    projectType: "" as string,
    status: "planning" as string,
    description: "",
    startDate: "",
    targetEndDate: "",
    address: "",
    logoUrl: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = undefined;
    });
    const project = await createProject.mutateAsync(payload as any);
    navigate({ to: `/projects/${project.id}` });
  };

  return (
    <div className="space-y-6">
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
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetEndDate">Target End Date</Label>
                    <Input id="targetEndDate" type="date" value={form.targetEndDate} onChange={(e) => update("targetEndDate", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St, City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." />
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

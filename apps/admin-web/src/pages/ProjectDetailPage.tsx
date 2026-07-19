import React, { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@elite-realty/shared-ui/components/ui";
import { PropertyType, PropertyStatus } from "@elite-realty/shared-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import * as Tabs from "@radix-ui/react-tabs";
import { Unit } from "@/hooks/use-units";
import { Property } from "@/hooks/use-properties";
import { InventoryUnit } from "@/hooks/use-project-inventory";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Layers,
  Building2,
  Plus,
  ChevronUp,
  ChevronDown,
  Home,
  Package,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  Upload
} from "lucide-react";
import {
  useProject,
  useProjectTimeline,
  useDeleteProject,
  useProjectImages,
  useUploadProjectImage,
  projectTypeLabels,
  projectStatusLabels,
  type ProjectStatus,
} from "@/hooks/use-projects";
import {
  usePhases,
  useCreatePhase,
  useUpdatePhase,
  useDeletePhase,
  phaseStatusLabels,
  type Phase,
  type PhaseStatus,
} from "@/hooks/use-phases";
import { useBudgets } from "@/hooks/use-budgets";
import { useProperty, usePropertySpecs, useCreateProperty } from "@/hooks/use-properties";
import { useUnits, useCreateUnit, useUpdateUnit } from "@/hooks/use-units";
import { useCreateBuilding } from "@/hooks/use-buildings";
import { useProjectInventory } from "@/hooks/use-project-inventory";
import { formatCurrency } from "@/lib/agent-meta";

const statusVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  planning: "secondary",
  pre_selling: "warning",
  construction: "default",
  fit_out: "default",
  completed: "success",
  turnover: "success",
  in_progress: "default",
  delayed: "destructive",
  on_hold: "warning",
};

const phaseStatuses: PhaseStatus[] = ["planning", "in_progress", "completed", "delayed", "on_hold"];

function phaseBarColor(status: string) {
  return status === "completed"
    ? "bg-green-500"
    : status === "delayed"
      ? "bg-red-500"
      : status === "on_hold"
        ? "bg-yellow-500"
        : "bg-primary";
}

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default function ProjectDetailPage() {
  const { id } = useParams({ from: "/protected/projects/$id" });
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const { data: project, isLoading, isError } = useProject(id);
  const { data: timeline } = useProjectTimeline(id);
  const { data: phases } = usePhases(id);
  const { data: budgetsData } = useBudgets({ projectId: id });
  const { data: inventory } = useProjectInventory(id);
  const { data: images } = useProjectImages(id);
  const uploadImage = useUploadProjectImage();
  const deleteProject = useDeleteProject();
  const queryClient = useQueryClient();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    await uploadImage.mutateAsync({ projectId: id, file });
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await api.delete(`/images/${imageId}`);
      queryClient.invalidateQueries({ queryKey: ["project-images", id] });
    } catch (err) {
      console.error(err);
      alert("Failed to delete image.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    await deleteProject.mutateAsync(id);
    navigate({ to: "/projects" });
  };

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
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
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
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
  const phaseList = phases ?? [];

  // Derived completion from phase progress (no fictional field)
  const completion = phaseList.length
    ? Math.round(phaseList.reduce((s, p) => s + p.progress, 0) / phaseList.length)
    : project.status === "completed" || project.status === "turnover"
      ? 100
      : 0;

  const totalPlanned = budgetList.reduce((s, b) => s + (b.totalPlanned || 0), 0);
  const totalActual = budgetList.reduce((s, b) => s + (b.totalActual || 0), 0);

  const tabTrigger = "px-2 py-3 text-sm font-bold tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all uppercase whitespace-nowrap";

  const primaryImage = images?.find(img => img.isPrimary) || images?.[0];

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)] min-h-0">
      {/* Compact Premium Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-card border border-border/60 shadow-sm shrink-0">
        {/* Background Image / Pattern */}
        {primaryImage ? (
          <>
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-20 mix-blend-multiply dark:mix-blend-screen bg-cover bg-center"
              style={{ backgroundImage: `url(${primaryImage.url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-card to-background" />
        )}

        {/* Content */}
        <div className="relative p-6 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-start gap-4 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate({ to: "/projects" })}
              className="bg-background/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground backdrop-blur-md shrink-0 h-10 w-10 mt-1 rounded-full shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant[project.status] ?? "secondary"} className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border-0 h-5">
                  {projectStatusLabels[project.status as ProjectStatus] ?? project.status}
                </Badge>
                {project.projectLogoUrl && (
                  <Avatar className="h-5 w-5 rounded shrink-0 ring-1 ring-border/50">
                    <AvatarImage src={project.projectLogoUrl} alt={project.name} className="object-cover" />
                  </Avatar>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-none">
                {project.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-primary" /> {project.address || "No address provided"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: `/projects/${id}/edit` })}
              className="bg-background/80 text-foreground border-border/60 hover:bg-muted h-9"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="h-9 shadow-sm"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Thin Premium Stats Bar */}
        <div className="relative border-t border-border/40 bg-muted/10">
          <div className="flex flex-wrap divide-x divide-border/40">
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Type</span>
              <span className="text-lg font-bold text-foreground capitalize truncate">{projectTypeLabels[project.projectType] ?? project.projectType}</span>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Completion</span>
              <span className="text-lg font-bold text-foreground">{completion}%</span>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phases</span>
              <span className="text-lg font-bold text-foreground">{phaseList.length}</span>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target</span>
              <span className="text-lg font-bold text-foreground">{fmtDate(project.targetCompletionDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0 space-y-4">
        <Tabs.List className="flex border-b border-border overflow-x-auto gap-8 pb-[1px] shrink-0">
          <Tabs.Trigger value="overview" className={tabTrigger}>Overview</Tabs.Trigger>
          <Tabs.Trigger value="gallery" className={tabTrigger}>Gallery ({images?.length ?? 0})</Tabs.Trigger>
          <Tabs.Trigger value="phases" className={tabTrigger}>Phases ({phaseList.length})</Tabs.Trigger>
          <Tabs.Trigger value="inventory" className={tabTrigger}>Inventory ({inventory?.totals.units ?? 0})</Tabs.Trigger>
          <Tabs.Trigger value="budgets" className={tabTrigger}>Budgets ({budgetList.length})</Tabs.Trigger>
          <Tabs.Trigger value="timeline" className={tabTrigger}>Timeline</Tabs.Trigger>
        </Tabs.List>

        {/* ── Overview ── */}
        <Tabs.Content value="overview" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden overflow-auto">
          <div className="grid gap-4 md:grid-cols-4 shrink-0">
            <StatCard icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} label="Total Planned" value={totalPlanned ? formatCurrency(totalPlanned) : "—"} />
            <StatCard icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} label="Total Spent" value={totalActual ? formatCurrency(totalActual) : "—"} />
            <StatCard icon={<Layers className="h-5 w-5 text-muted-foreground" />} label="Phases" value={String(phaseList.length)} />
            <StatCard icon={<Package className="h-5 w-5 text-muted-foreground" />} label="Units" value={String(inventory?.totals.units ?? 0)} />
          </div>
          
          <Card className="overflow-hidden border-border/60 shadow-sm shrink-0">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40">
                <div className="flex-1 p-5 md:p-6 flex flex-col gap-6">
                  {project.description ? (
                    <div className="border-b border-border/40 pb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">Description</p>
                      <p className="text-sm leading-relaxed text-foreground/90">{project.description}</p>
                    </div>
                  ) : (
                    <div className="border-b border-border/40 pb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">Description</p>
                      <p className="text-sm text-muted-foreground italic">No description provided.</p>
                    </div>
                  )}
                  <div className="flex-1 grid grid-cols-2 gap-y-5 gap-x-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">Target Start</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground/50" />
                        {fmtDate(project.targetStartDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">Target Completion</p>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground/50" />
                        {fmtDate(project.targetCompletionDate)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">Phase Completion Progress</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${completion >= 100 ? "bg-green-500" : "bg-primary"}`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-10 text-right">{completion}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* ── Gallery ── */}
        <Tabs.Content value="gallery" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden overflow-auto pr-2 relative">
          <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur-sm py-2 border-b border-transparent">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Image Gallery</h2>
              <p className="text-muted-foreground text-sm">Manage photos and renderings for this project.</p>
            </div>
            <div className="relative">
              <Button disabled={uploadImage.isPending}>
                {uploadImage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                Upload Photo
              </Button>
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                onChange={handleImageUpload}
                disabled={uploadImage.isPending}
              />
            </div>
          </div>
          
          {!images?.length ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState 
                  title="No images uploaded" 
                  description="Upload some photos to create a gallery." 
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map(img => (
                <Dialog key={img.id}>
                  <div className="relative aspect-video rounded-lg overflow-hidden border group bg-muted">
                    <img src={img.url} alt={img.alt ?? "Project image"} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-sm">
                        Primary
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteImage(img.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
                    <img src={img.url} alt={img.alt || "Project image"} className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* ── Phases (editable) ── */}
        <Tabs.Content value="phases" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden">
          <PhasesTab projectId={id} phases={phaseList} />
        </Tabs.Content>

        {/* ── Inventory ── */}
        <Tabs.Content value="inventory" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden">
          <InventoryTab projectId={id} />
        </Tabs.Content>

        {/* ── Budgets ── */}
        <Tabs.Content value="budgets" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden overflow-auto">
          {budgetList.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState title="No budgets created yet" />
              </CardContent>
            </Card>
          ) : (
            budgetList.map((budget) => {
              const pct = budget.totalPlanned > 0 ? (budget.totalActual / budget.totalPlanned) * 100 : 0;
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
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${pct <= 100 ? "bg-green-500" : pct <= 120 ? "bg-yellow-500" : "bg-red-500"}`} />
                        <Badge variant={budget.status === "approved" ? "success" : budget.status === "active" ? "default" : "secondary"}>
                          {budget.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><p className="text-muted-foreground">Planned</p><p className="font-medium">{formatCurrency(budget.totalPlanned)}</p></div>
                      <div><p className="text-muted-foreground">Actual</p><p className="font-medium">{formatCurrency(budget.totalActual)}</p></div>
                      <div><p className="text-muted-foreground">Variance</p><p className={`font-medium ${pct <= 100 ? "text-green-600" : "text-red-600"}`}>{pct > 0 ? `${(pct - 100).toFixed(1)}%` : "—"}</p></div>
                    </div>
                    <div className="mt-3 w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full ${pct <= 100 ? "bg-green-500" : pct <= 120 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Tabs.Content>

        {/* ── Timeline ── */}
        <Tabs.Content value="timeline" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden overflow-auto">
          <Card>
            <CardHeader><CardTitle>Project Timeline</CardTitle></CardHeader>
            <CardContent>
              {!timeline || timeline.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-medium text-muted-foreground">No timeline data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((entry) => (
                    <div key={entry.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.phaseName}</span>
                          <Badge variant={statusVariant[entry.status] ?? "secondary"}>
                            {phaseStatusLabels[entry.status as PhaseStatus] ?? entry.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">{fmtDate(entry.startDate)} — {fmtDate(entry.endDate)}</span>
                      </div>
                      <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 rounded-md ${phaseBarColor(entry.status)}`} style={{ width: `${Math.min(entry.progress, 100)}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white mix-blend-difference">{entry.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-xl shadow-sm shrink-0">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
        <div className="text-2xl font-extrabold tracking-tight text-foreground">{value}</div>
      </div>
      <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

/* ─────────────── Phases tab (full CRUD + reorder) ─────────────── */

interface PhaseForm {
  name: string;
  status: PhaseStatus;
  targetStart: string;
  targetEnd: string;
}

const emptyForm: PhaseForm = { name: "", status: "planning", targetStart: "", targetEnd: "" };

function PhasesTab({ projectId, phases }: { projectId: string; phases: Phase[] }) {
  const createPhase = useCreatePhase();
  const updatePhase = useUpdatePhase();
  const deletePhase = useDeletePhase();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Phase | null>(null);
  const [form, setForm] = useState<PhaseForm>(emptyForm);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Phase) => {
    setEditing(p);
    setForm({
      name: p.name,
      status: p.status,
      targetStart: p.targetStart ? p.targetStart.split("T")[0] : "",
      targetEnd: p.targetEnd ? p.targetEnd.split("T")[0] : "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editing) {
      await updatePhase.mutateAsync({ id: editing.id, ...form });
    } else {
      await createPhase.mutateAsync({ projectId, ...form });
    }
    setOpen(false);
  };

  const remove = async (p: Phase) => {
    if (!window.confirm(`Delete phase "${p.name}"?`)) return;
    await deletePhase.mutateAsync({ id: p.id, projectId });
  };

  const move = async (p: Phase, dir: -1 | 1) => {
    const sorted = [...phases].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((x) => x.id === p.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      updatePhase.mutateAsync({ id: p.id, order: swap.order }),
      updatePhase.mutateAsync({ id: swap.id, order: p.order }),
    ]);
  };

  const markStart = (p: Phase) =>
    updatePhase.mutateAsync({ id: p.id, status: "in_progress", actualStart: new Date().toISOString() });
  const markComplete = (p: Phase) =>
    updatePhase.mutateAsync({ id: p.id, status: "completed", actualEnd: new Date().toISOString() });

  const sorted = [...phases].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4 relative">
      <div className="sticky top-0 z-10 flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-sm py-2 border-b border-transparent">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Project Phases</h2>
          <p className="text-muted-foreground text-sm">Manage and track the timeline of construction phases.</p>
        </div>
        <Button onClick={openNew} className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Add Phase</Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="shrink-0">
          <CardContent className="p-0">
            <EmptyState title="No phases defined yet" />
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1 overflow-hidden border-border/60 shadow-sm min-h-0 flex flex-col">
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {sorted.map((phase, i) => (
              <div key={phase.id} className="p-4 md:p-5 bg-background hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">#{i + 1}</span>
                    <h3 className="font-bold truncate text-foreground">{phase.name}</h3>
                    <Badge variant={statusVariant[phase.status] ?? "secondary"} className="px-2 font-bold uppercase tracking-wider text-[10px]">
                      {phaseStatusLabels[phase.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 bg-muted/50 p-0.5 rounded-md">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" disabled={i === 0} onClick={() => move(phase, -1)}><ChevronUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" disabled={i === sorted.length - 1} onClick={() => move(phase, 1)}><ChevronDown className="h-4 w-4" /></Button>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => openEdit(phase)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(phase)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Target: {fmtDate(phase.targetStart)} — {fmtDate(phase.targetEnd)}</span>
                  {(phase.actualStart || phase.actualEnd) && (
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Actual: {fmtDate(phase.actualStart)} — {fmtDate(phase.actualEnd)}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${phaseBarColor(phase.status)}`} style={{ width: `${phase.progress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-right">{phase.progress}%</span>
                </div>
                
                {phase.status !== "completed" && (
                  <div className="mt-4 flex gap-2">
                    {phase.status !== "in_progress" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold bg-background/50 shadow-sm" onClick={() => markStart(phase)}>Mark Started</Button>
                    )}
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold bg-background/50 shadow-sm" onClick={() => markComplete(phase)}>Mark Completed</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Phase" : "New Phase"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Phase Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Foundation & Structure" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as PhaseStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {phaseStatuses.map((s) => <SelectItem key={s} value={s}>{phaseStatusLabels[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Start</Label>
                <Input type="date" value={form.targetStart} onChange={(e) => setForm((f) => ({ ...f, targetStart: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Target End</Label>
                <Input type="date" value={form.targetEnd} onChange={(e) => setForm((f) => ({ ...f, targetEnd: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={createPhase.isPending || updatePhase.isPending}>
              {editing ? "Save Changes" : "Create Phase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─────────────── Inventory tab (Project → Buildings → Units → Property) ─────────────── */

const unitStatusVariant: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  available: "success",
  occupied: "default",
  reserved: "warning",
  rented: "default",
  rto_active: "default",
  under_maintenance: "destructive",
};

function InventoryTab({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const { data: inventory, isLoading } = useProjectInventory(projectId);
  const createBuilding = useCreateBuilding();
  const createUnit = useCreateUnit();
  const createProperty = useCreateProperty();
  const updateUnit = useUpdateUnit();
  
  const [openNewBuilding, setOpenNewBuilding] = React.useState(false);
  const [buildingForm, setBuildingForm] = React.useState({
    name: "",
    buildingType: "tower",
    floorCount: "",
    unitCount: "",
    address: "",
  });

  const [activeBuildingId, setActiveBuildingId] = React.useState<string | null>(null);
  const [openGenerateUnits, setOpenGenerateUnits] = React.useState(false);
  const [generateForm, setGenerateForm] = React.useState({
    startFloor: 1,
    endFloor: 10,
    unitsPerFloor: 5,
    unitType: "studio",
  });
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBuildingId) return;
    
    setIsGenerating(true);
    try {
      const unitsToCreate = [];
      for (let floor = generateForm.startFloor; floor <= generateForm.endFloor; floor++) {
        for (let unit = 1; unit <= generateForm.unitsPerFloor; unit++) {
          const unitNumberStr = `${floor}${unit.toString().padStart(2, "0")}`;
          unitsToCreate.push({
            buildingId: activeBuildingId,
            unitNumber: unitNumberStr,
            unitType: generateForm.unitType,
            status: "available",
          });
        }
      }
      
      // Batch promises in chunks of 5 to avoid overwhelming the server
      const chunkSize = 5;
      for (let i = 0; i < unitsToCreate.length; i += chunkSize) {
        const chunk = unitsToCreate.slice(i, i + chunkSize);
        await Promise.all(chunk.map(u => createUnit.mutateAsync(u)));
      }
      
      setOpenGenerateUnits(false);
    } catch (error) {
      console.error("Failed to generate units:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleListAsProperty = async (e: React.MouseEvent, unit: InventoryUnit, buildingName: string) => {
    e.stopPropagation();
    try {
      const propertyTypeMap: Record<string, PropertyType> = {
        studio: PropertyType.CondoUnit, one_br: PropertyType.CondoUnit, two_br: PropertyType.CondoUnit, three_br: PropertyType.CondoUnit,
        penthouse: PropertyType.CondoUnit, commercial: PropertyType.CommercialSpace, parking: PropertyType.ParkingSlot
      };
      
      const newProperty = await createProperty.mutateAsync({
        projectId,
        type: propertyTypeMap[unit.unitType ?? ""] || PropertyType.CondoUnit,
        status: PropertyStatus.Available,
        code: `${buildingName.substring(0,3).toUpperCase()}-${unit.unitNumber}`,
      });
      
      await updateUnit.mutateAsync({
        id: unit.id,
        propertyId: newProperty.id
      });
    } catch (error) {
      console.error("Failed to list property:", error);
    }
  };

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBuilding.mutateAsync({
      projectId,
      name: buildingForm.name,
      type: buildingForm.buildingType,
      floorCount: buildingForm.floorCount ? parseInt(buildingForm.floorCount) : undefined,
      units: buildingForm.unitCount ? parseInt(buildingForm.unitCount) : undefined,
      address: buildingForm.address || undefined,
    });
    setOpenNewBuilding(false);
    setBuildingForm({ name: "", buildingType: "tower", floorCount: "", unitCount: "", address: "" });
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const isEmpty = !inventory || inventory.buildings.length === 0;
  const totals = inventory?.totals ?? { buildings: 0, units: 0, byStatus: {} };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4 relative">
      <div className="flex items-center justify-between shrink-0 py-2 border-b border-transparent">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Project Inventory</h2>
          <p className="text-muted-foreground text-sm">Manage buildings, floors, and unit availability.</p>
        </div>
        <Dialog open={openNewBuilding} onOpenChange={setOpenNewBuilding}>
          <DialogTrigger asChild>
            <Button className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Add Building</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBuilding} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Building Name *</Label>
                <Input required value={buildingForm.name} onChange={(e) => setBuildingForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Tower 1, Block A" />
              </div>
              <div className="space-y-2">
                <Label>Building Type</Label>
                <Select value={buildingForm.buildingType} onValueChange={(v) => setBuildingForm((f) => ({ ...f, buildingType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tower">Tower (High-rise)</SelectItem>
                    <SelectItem value="mid_rise">Mid-rise</SelectItem>
                    <SelectItem value="low_rise">Low-rise</SelectItem>
                    <SelectItem value="cluster">Cluster / Townhouse</SelectItem>
                    <SelectItem value="block">Block / Lot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Floor Count</Label>
                  <Input type="number" min="1" value={buildingForm.floorCount} onChange={(e) => setBuildingForm((f) => ({ ...f, floorCount: e.target.value }))} placeholder="e.g. 50" />
                </div>
                <div className="space-y-2">
                  <Label>Total Units (Approx)</Label>
                  <Input type="number" min="1" value={buildingForm.unitCount} onChange={(e) => setBuildingForm((f) => ({ ...f, unitCount: e.target.value }))} placeholder="e.g. 500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address (Optional)</Label>
                <Input value={buildingForm.address} onChange={(e) => setBuildingForm((f) => ({ ...f, address: e.target.value }))} placeholder="Specific building address" />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpenNewBuilding(false)}>Cancel</Button>
                <Button type="submit" disabled={createBuilding.isPending}>
                  {createBuilding.isPending ? "Creating..." : "Create Building"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isEmpty ? (
        <Card className="shrink-0">
          <CardContent className="p-0">
            <EmptyState title="No buildings or units in this project yet" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4 shrink-0">
            <StatCard icon={<Building2 className="h-5 w-5 text-muted-foreground" />} label="Buildings" value={String(totals.buildings)} />
            <StatCard icon={<Package className="h-5 w-5 text-muted-foreground" />} label="Total Units" value={String(totals.units)} />
            <StatCard icon={<Home className="h-5 w-5 text-muted-foreground" />} label="Available" value={String(totals.byStatus?.available ?? 0)} />
            <StatCard icon={<Home className="h-5 w-5 text-muted-foreground" />} label="Sold / Occupied" value={String(totals.byStatus?.occupied ?? 0)} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
            {inventory.buildings.map((b) => (
              <Card key={b.id} className="border-border/60 shadow-sm shrink-0">
                <div className="bg-background rounded-xl">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-20 shadow-sm">
                      {/* Building Header Row */}
                      <tr className="border-b border-border/40">
                        <th colSpan={6} className="p-0 font-normal">
                          <div className="flex items-center justify-between py-3 px-4 bg-card rounded-t-xl border-t border-border/60 -mt-[1px]">
                            <div className="flex items-center gap-2 text-base font-extrabold tracking-tight">
                              <Building2 className="h-4 w-4 text-muted-foreground" /> {b.name}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="secondary" className="px-2 font-bold bg-muted text-muted-foreground shadow-sm">{b.unitCount} units</Badge>
                              <Button variant="outline" size="sm" className="h-7 text-xs font-bold shadow-sm bg-background/50 hover:bg-muted hidden sm:flex" onClick={() => {
                                setActiveBuildingId(b.id);
                                setOpenGenerateUnits(true);
                              }}>
                                <Plus className="h-3 w-3 mr-1" /> Generate
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs font-bold shadow-sm bg-background/50 hover:bg-muted" onClick={() => navigate({ to: `/buildings/${b.id}` })}>Open</Button>
                            </div>
                          </div>
                        </th>
                      </tr>
                      {/* Column Headers Row */}
                      {b.units.length > 0 && (
                        <tr className="bg-muted/95 backdrop-blur-sm">
                          <th className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-3 border-b border-border/40">Unit</th>
                          <th className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-3 border-b border-border/40">Floor</th>
                          <th className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-3 border-b border-border/40">Type</th>
                          <th className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-3 border-b border-border/40">Status</th>
                          <th className="text-left font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-3 border-b border-border/40">Property (Title)</th>
                          <th className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground px-4 py-3 border-b border-border/40">Actions</th>
                        </tr>
                      )}
                    </thead>
                    {b.units.length === 0 ? (
                      <tbody>
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sm font-medium text-muted-foreground">
                            No units generated yet.
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody className="divide-y divide-border/40">
                        {b.units.map((u) => (
                          <tr
                            key={u.id}
                            className={`hover:bg-muted/20 transition-colors ${u.propertyId ? "cursor-pointer" : ""}`}
                            onClick={() => u.propertyId && navigate({ to: `/properties/${u.propertyId}` })}
                          >
                            <td className="px-4 py-2 font-bold text-foreground whitespace-nowrap">{u.unitNumber}</td>
                            <td className="px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{u.floorNumber ?? "—"}</td>
                            <td className="px-4 py-2 text-muted-foreground font-medium whitespace-nowrap capitalize">{u.unitType.replace(/_/g, " ")}</td>
                            <td className="px-4 py-2 whitespace-nowrap"><Badge variant={unitStatusVariant[u.status] ?? "secondary"} className="text-[10px] uppercase tracking-wider font-bold px-2">{u.status.replace(/_/g, " ")}</Badge></td>
                            <td className="px-4 py-2 text-muted-foreground font-medium truncate max-w-[200px]">{u.propertyCode ?? "—"}</td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {!u.propertyId ? (
                                <Button size="sm" variant="outline" className="h-6 text-[10px] font-bold px-2 shadow-sm" onClick={(e) => handleListAsProperty(e, u, b.name)}>
                                  List as Property
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" className="h-6 text-[10px] font-bold px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50" onClick={(e) => {
                                  e.stopPropagation();
                                  navigate({ to: `/properties/${u.propertyId}` });
                                }}>
                                  View Property
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    )}
                  </table>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Bulk Generate Modal */}
      <Dialog open={openGenerateUnits} onOpenChange={setOpenGenerateUnits}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Generate Units</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerateUnits} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Floor</Label>
                <Input type="number" min="1" required value={generateForm.startFloor} onChange={(e) => setGenerateForm(f => ({ ...f, startFloor: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-2">
                <Label>End Floor</Label>
                <Input type="number" min="1" required value={generateForm.endFloor} onChange={(e) => setGenerateForm(f => ({ ...f, endFloor: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Units per Floor</Label>
                <Input type="number" min="1" max="100" required value={generateForm.unitsPerFloor} onChange={(e) => setGenerateForm(f => ({ ...f, unitsPerFloor: parseInt(e.target.value) || 1 }))} />
              </div>
              <div className="space-y-2">
                <Label>Default Unit Type</Label>
                <Select value={generateForm.unitType} onValueChange={(v) => setGenerateForm(f => ({ ...f, unitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="one_br">1 Bedroom</SelectItem>
                    <SelectItem value="two_br">2 Bedroom</SelectItem>
                    <SelectItem value="three_br">3 Bedroom</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This will automatically generate {Math.max(0, generateForm.endFloor - generateForm.startFloor + 1) * generateForm.unitsPerFloor} units numbered automatically (e.g. 1001, 1002...).
            </p>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpenGenerateUnits(false)}>Cancel</Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Units"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



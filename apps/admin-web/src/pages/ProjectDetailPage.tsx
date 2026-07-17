import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Tabs from "@radix-ui/react-tabs";
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
} from "lucide-react";
import {
  useProject,
  useProjectTimeline,
  useDeleteProject,
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
  const phaseList = phases ?? [];

  // Derived completion from phase progress (no fictional field)
  const completion = phaseList.length
    ? Math.round(phaseList.reduce((s, p) => s + p.progress, 0) / phaseList.length)
    : project.status === "completed" || project.status === "turnover"
      ? 100
      : 0;

  const totalPlanned = budgetList.reduce((s, b) => s + (b.totalPlanned || 0), 0);
  const totalActual = budgetList.reduce((s, b) => s + (b.totalActual || 0), 0);

  const tabTrigger = "px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/projects" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {project.projectLogoUrl && (
              <img src={project.projectLogoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant={statusVariant[project.status] ?? "secondary"}>
                  {projectStatusLabels[project.status as ProjectStatus] ?? project.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{projectTypeLabels[project.projectType] ?? project.projectType}</p>
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
        <Tabs.List className="flex border-b overflow-x-auto">
          <Tabs.Trigger value="overview" className={tabTrigger}>Overview</Tabs.Trigger>
          <Tabs.Trigger value="phases" className={tabTrigger}>Phases ({phaseList.length})</Tabs.Trigger>
          <Tabs.Trigger value="inventory" className={tabTrigger}>Inventory ({inventory?.totals.units ?? 0})</Tabs.Trigger>
          <Tabs.Trigger value="budgets" className={tabTrigger}>Budgets ({budgetList.length})</Tabs.Trigger>
          <Tabs.Trigger value="timeline" className={tabTrigger}>Timeline</Tabs.Trigger>
        </Tabs.List>

        {/* ── Overview ── */}
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
                  <p className="text-sm text-muted-foreground">Target Start</p>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {fmtDate(project.targetStartDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Completion</p>
                  <p className="font-medium flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {fmtDate(project.targetCompletionDate)}
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
                  <p className="text-sm text-muted-foreground">Completion (from phases)</p>
                  <p className="font-medium mt-1">{completion}%</p>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${completion >= 100 ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${completion}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} label="Total Planned" value={totalPlanned ? formatCurrency(totalPlanned) : "—"} />
            <StatCard icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} label="Total Spent" value={totalActual ? formatCurrency(totalActual) : "—"} />
            <StatCard icon={<Layers className="h-5 w-5 text-muted-foreground" />} label="Phases" value={String(phaseList.length)} />
            <StatCard icon={<Package className="h-5 w-5 text-muted-foreground" />} label="Units" value={String(inventory?.totals.units ?? 0)} />
          </div>
        </Tabs.Content>

        {/* ── Phases (editable) ── */}
        <Tabs.Content value="phases" className="space-y-4">
          <PhasesTab projectId={id} phases={phaseList} />
        </Tabs.Content>

        {/* ── Inventory ── */}
        <Tabs.Content value="inventory" className="space-y-4">
          <InventoryTab projectId={id} />
        </Tabs.Content>

        {/* ── Budgets ── */}
        <Tabs.Content value="budgets" className="space-y-4">
          {budgetList.length === 0 ? (
            <EmptyState icon={<DollarSign className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />} text="No budgets created yet" />
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
        <Tabs.Content value="timeline" className="space-y-4">
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
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">{icon}<span className="text-2xl font-bold">{value}</span></div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card><CardContent className="py-12 text-center">{icon}<p className="font-medium">{text}</p></CardContent></Card>
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Phase</Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={<Layers className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />} text="No phases defined yet" />
      ) : (
        sorted.map((phase, i) => (
          <Card key={phase.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground shrink-0">#{i + 1}</span>
                  <h3 className="font-semibold truncate">{phase.name}</h3>
                  <Badge variant={statusVariant[phase.status] ?? "secondary"}>{phaseStatusLabels[phase.status]}</Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(phase, -1)}><ChevronUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" disabled={i === sorted.length - 1} onClick={() => move(phase, 1)}><ChevronDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(phase)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(phase)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground mb-3">
                <span>Target: {fmtDate(phase.targetStart)} — {fmtDate(phase.targetEnd)}</span>
                {(phase.actualStart || phase.actualEnd) && (
                  <span>Actual: {fmtDate(phase.actualStart)} — {fmtDate(phase.actualEnd)}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${phaseBarColor(phase.status)}`} style={{ width: `${phase.progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8">{phase.progress}%</span>
              </div>
              <div className="mt-3 flex gap-2">
                {phase.status !== "in_progress" && phase.status !== "completed" && (
                  <Button variant="outline" size="sm" onClick={() => markStart(phase)}>Mark Started</Button>
                )}
                {phase.status !== "completed" && (
                  <Button variant="outline" size="sm" onClick={() => markComplete(phase)}>Mark Completed</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
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

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!inventory || inventory.buildings.length === 0) {
    return <EmptyState icon={<Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />} text="No buildings or units in this project yet" />;
  }

  const { totals } = inventory;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Building2 className="h-5 w-5 text-muted-foreground" />} label="Buildings" value={String(totals.buildings)} />
        <StatCard icon={<Package className="h-5 w-5 text-muted-foreground" />} label="Total Units" value={String(totals.units)} />
        <StatCard icon={<Home className="h-5 w-5 text-muted-foreground" />} label="Available" value={String(totals.byStatus.available ?? 0)} />
        <StatCard icon={<Home className="h-5 w-5 text-muted-foreground" />} label="Sold / Occupied" value={String((totals.byStatus.occupied ?? 0))} />
      </div>

      {inventory.buildings.map((b) => (
        <Card key={b.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" /> {b.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{b.unitCount} units</Badge>
                <Button variant="outline" size="sm" onClick={() => navigate({ to: `/buildings/${b.id}` })}>Open</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {b.units.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No units.</p>
            ) : (
              <div className="rounded-md border scroll-grid max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Unit</th>
                      <th className="text-left">Floor</th>
                      <th className="text-left">Type</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Property (Title)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.units.map((u) => (
                      <tr
                        key={u.id}
                        className={u.propertyId ? "cursor-pointer" : ""}
                        onClick={() => u.propertyId && navigate({ to: `/properties/${u.propertyId}` })}
                      >
                        <td className="font-medium">{u.unitNumber}</td>
                        <td>{u.floorNumber ?? "—"}</td>
                        <td>{u.unitType.replace(/_/g, " ")}</td>
                        <td><Badge variant={unitStatusVariant[u.status] ?? "secondary"}>{u.status.replace(/_/g, " ")}</Badge></td>
                        <td className="text-primary">{u.propertyCode ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

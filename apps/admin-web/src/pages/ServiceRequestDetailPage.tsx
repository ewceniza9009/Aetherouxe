import { useMemo, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Plus,
  Loader2,
  CalendarDays,
  Tag,
  User,
  FileText,
  Wrench,
  MessageSquare,
} from "lucide-react";
import { formatCurrency } from "@/lib/agent-meta";
import {
  useServiceRequest,
  useAssignRequest,
  useCompleteRequest,
  useCancelRequest,
  useWorkOrders,
  useCreateWorkOrder,
  type ServiceCategory,
  type ServicePriority,
  type WorkOrder,
  type WorkOrderStatus,
} from "@/hooks/use-service-requests";

const priorityMeta: Record<ServicePriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  emergency: { label: "Emergency", className: "bg-red-100 text-red-700 border-red-200" },
};

const statusMeta: Record<string, { label: string; variant: any }> = {
  open: { label: "Open", variant: "default" },
  assigned: { label: "Assigned", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const categoryMeta: Record<ServiceCategory, string> = {
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  general: "General",
  pest: "Pest Control",
  elevator: "Elevator",
  other: "Other",
};

const woStatusMeta: Record<WorkOrderStatus, { label: string; variant: any }> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function money(n: number) {
  return formatCurrency(Number(n ?? 0));
}

export default function ServiceRequestDetailPage() {
  const { id } = useParams({ from: "/protected/service-requests/$id" });
  const navigate = useNavigate();
  const { data: request, isLoading, isError } = useServiceRequest(id);
  const { data: workOrdersData, isLoading: loadingWo } = useWorkOrders({
    serviceRequestId: id,
    limit: 100,
  });
  const assign = useAssignRequest();
  const complete = useCompleteRequest();
  const cancel = useCancelRequest();
  const createWorkOrder = useCreateWorkOrder();

  const [assignOpen, setAssignOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [woOpen, setWoOpen] = useState(false);

  const [assignForm, setAssignForm] = useState({ assignedToId: "", assignedToType: "" });
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [woForm, setWoForm] = useState({
    vendorId: "",
    estimatedCost: "",
    actualCost: "",
    scheduledDate: "",
    notes: "",
    status: "scheduled" as WorkOrderStatus,
  });

  const workOrders = useMemo(
    () => (workOrdersData?.data ?? []).slice().reverse(),
    [workOrdersData]
  );

  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-8 py-5 border-b border-border/60 bg-card/50 shrink-0">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate({ to: "/service-requests" })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Service Request</h1>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <p className="mt-4 text-base font-semibold">Failed to load service request</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || !request) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-8 py-5 border-b border-border/60 bg-card/50 shrink-0">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 overflow-auto p-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const handleAssign = async () => {
    await assign.mutateAsync({
      id: request.id,
      assignedToId: assignForm.assignedToId,
      assignedToType: assignForm.assignedToType,
    });
    setAssignOpen(false);
    setAssignForm({ assignedToId: "", assignedToType: "" });
  };

  const handleComplete = async () => {
    await complete.mutateAsync({ id: request.id, resolutionNotes });
    setCompleteOpen(false);
    setResolutionNotes("");
  };

  const handleCancel = async () => {
    await cancel.mutateAsync({ id: request.id, reason: resolutionNotes || undefined });
    setCancelOpen(false);
    setResolutionNotes("");
  };

  const handleCreateWo = async () => {
    await createWorkOrder.mutateAsync({
      serviceRequestId: request.id,
      vendorId: woForm.vendorId || undefined,
      estimatedCost: woForm.estimatedCost ? Number(woForm.estimatedCost) : undefined,
      actualCost: woForm.actualCost ? Number(woForm.actualCost) : undefined,
      scheduledDate: woForm.scheduledDate || undefined,
      notes: woForm.notes || undefined,
      status: woForm.status,
    });
    setWoOpen(false);
    setWoForm({ vendorId: "", estimatedCost: "", actualCost: "", scheduledDate: "", notes: "", status: "scheduled" });
  };

  const terminal = request.status === "completed" || request.status === "cancelled";

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/60 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate({ to: "/service-requests" })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                #{request.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant={statusMeta[request.status].variant}>
                {statusMeta[request.status].label}
              </Badge>
              <Badge className={priorityMeta[request.priority].className}>
                {priorityMeta[request.priority].label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {categoryMeta[request.category]} — {request.description.slice(0, 60)}{request.description.length > 60 ? "..." : ""}
            </p>
          </div>
        </div>
        {!terminal && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <UserCheck className="mr-2 h-4 w-4" /> Assign
            </Button>
            <Button variant="outline" onClick={() => setCompleteOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
            </Button>
            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Category</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{categoryMeta[request.category]}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Requested</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{new Date(request.createdAt).toLocaleDateString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {request.scheduledAt ? new Date(request.scheduledAt).toLocaleDateString() : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assigned To</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{request.assignedToName || "Unassigned"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" /> Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90">
              {request.description}
            </p>
            {request.resolutionNotes && (
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Resolution
                </p>
                <p className="mt-1.5 text-sm text-emerald-700 dark:text-emerald-300">{request.resolutionNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs — fixed min-height to prevent layout shift */}
        <Tabs defaultValue="workorders">
          <TabsList>
            <TabsTrigger value="workorders">
              <Wrench className="h-3.5 w-3.5 mr-1.5" />
              Work Orders
            </TabsTrigger>
            <TabsTrigger value="activity">
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workorders" className="mt-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Work Orders</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Vendor work for this request</p>
                  </div>
                  <Button size="sm" className="h-8 text-xs" onClick={() => setWoOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> New Work Order
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingWo ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : workOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <Wrench className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">No work orders created yet.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                          <th className="px-4 py-3 text-left font-semibold">Contractor</th>
                          <th className="px-4 py-3 text-right font-semibold">Est. Cost</th>
                          <th className="px-4 py-3 text-right font-semibold">Actual</th>
                          <th className="px-4 py-3 font-semibold">Scheduled</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workOrders.map((w: WorkOrder) => (
                          <tr key={w.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 font-medium text-sm">{w.vendorId || "—"}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">
                              {w.estimatedCost != null ? money(w.estimatedCost) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-sm">
                              {w.actualCost != null ? money(w.actualCost) : "—"}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {w.scheduledDate ? new Date(w.scheduledDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={woStatusMeta[w.status].variant} className="text-[10px]">
                                {woStatusMeta[w.status].label}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4 min-h-[300px]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Activity Timeline</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Status changes and work orders</p>
              </CardHeader>
              <CardContent>
                {workOrders.length === 0 ? (
                  <div className="py-12 text-center">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30" />
                    <p className="mt-3 text-sm text-muted-foreground">No activity recorded yet.</p>
                  </div>
                ) : (
                  <ol className="relative border-l border-border/60 pl-8 space-y-6">
                    {workOrders.map((w: WorkOrder) => (
                      <li key={w.id} className="relative">
                        <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary/60 ring-4 ring-background" />
                        <div>
                          <p className="text-sm font-medium">
                            Work order created{w.vendorId ? ` · ${w.vendorId}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(w.createdAt).toLocaleString()} · {woStatusMeta[w.status].label}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Request</DialogTitle>
            <DialogDescription>Assign a team member or external contractor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assignee ID</Label>
              <Input
                value={assignForm.assignedToId}
                onChange={(e) => setAssignForm((f) => ({ ...f, assignedToId: e.target.value }))}
                placeholder="User or contractor ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee Type</Label>
              <Select
                value={assignForm.assignedToType}
                onValueChange={(v) => setAssignForm((f) => ({ ...f, assignedToType: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Internal Staff</SelectItem>
                  <SelectItem value="vendor">External Contractor</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assign.isPending || !assignForm.assignedToId}>
              {assign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Request</DialogTitle>
            <DialogDescription>Add resolution notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Resolution Notes</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="How was this resolved?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={complete.isPending}>
              {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Request</DialogTitle>
            <DialogDescription>Provide a reason for cancellation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Reason for cancellation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancel.isPending}>
              {cancel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={woOpen} onOpenChange={setWoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Work Order</DialogTitle>
            <DialogDescription>Create a work order for an external contractor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Contractor Name</Label>
              <Input
                value={woForm.vendorId}
                onChange={(e) => setWoForm((f) => ({ ...f, vendorId: e.target.value }))}
                placeholder="e.g. ABC Plumbing Co."
              />
              <p className="text-[11px] text-muted-foreground">Name of the external contractor performing this work.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={woForm.estimatedCost}
                  onChange={(e) => setWoForm((f) => ({ ...f, estimatedCost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Actual Cost</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={woForm.actualCost}
                  onChange={(e) => setWoForm((f) => ({ ...f, actualCost: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="datetime-local"
                  value={woForm.scheduledDate}
                  onChange={(e) => setWoForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={woForm.status}
                  onValueChange={(v) => setWoForm((f) => ({ ...f, status: v as WorkOrderStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(woStatusMeta) as WorkOrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{woStatusMeta[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={woForm.notes}
                onChange={(e) => setWoForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Work order details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWoOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWo} disabled={createWorkOrder.isPending}>
              {createWorkOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

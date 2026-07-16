import { useMemo, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const priorityMeta: Record<
  ServicePriority,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-700 border-slate-200" },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  high: {
    label: "High",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
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

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
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
      <div className="space-y-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate({ to: "/service-requests" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load service request</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !request) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
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
    setWoForm({
      vendorId: "",
      estimatedCost: "",
      actualCost: "",
      scheduledDate: "",
      notes: "",
      status: "scheduled",
    });
  };

  const terminal = request.status === "completed" || request.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: "/service-requests" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                #{request.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant={statusMeta[request.status].variant}>
                {statusMeta[request.status].label}
              </Badge>
              <Badge className={priorityMeta[request.priority].className}>
                {priorityMeta[request.priority].label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {categoryMeta[request.category]}
            </p>
          </div>
        </div>
        {!terminal && (
          <div className="flex flex-wrap gap-2">
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

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={<Tag className="h-5 w-5" />} label="Category" value={categoryMeta[request.category]} />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Requested"
          value={new Date(request.createdAt).toLocaleDateString()}
        />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Scheduled"
          value={request.scheduledAt ? new Date(request.scheduledAt).toLocaleDateString() : "—"}
        />
        <SummaryCard
          icon={<User className="h-5 w-5" />}
          label="Assigned To"
          value={request.assignedToName || "Unassigned"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">
            {request.description}
          </p>
          {request.resolutionNotes && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Resolution
              </p>
              <p className="mt-1 text-sm text-green-800">{request.resolutionNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="workorders">
        <TabsList>
          <TabsTrigger value="workorders">Work Orders</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="workorders" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Work Orders</CardTitle>
                  <p className="text-sm text-muted-foreground">Vendor work for this request</p>
                </div>
                <Button size="sm" onClick={() => setWoOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Work Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWo ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : workOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No work orders created yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Est. Cost</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((w: WorkOrder) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">{w.vendorId || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {w.estimatedCost != null ? money(w.estimatedCost) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {w.actualCost != null ? money(w.actualCost) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {w.scheduledDate
                            ? new Date(w.scheduledDate).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={woStatusMeta[w.status].variant}>
                            {woStatusMeta[w.status].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Status changes and work orders
              </p>
            </CardHeader>
            <CardContent>
              {workOrders.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              ) : (
                <ol className="relative border-l border-muted pl-6 space-y-4">
                  {workOrders.map((w: WorkOrder) => (
                    <li key={w.id} className="relative">
                      <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-accent" />
                       <p className="text-sm font-medium">
                         Work order created{ w.vendorId ? ` · ${w.vendorId}` : "" }
                       </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.createdAt).toLocaleString()} ·{" "}
                        {woStatusMeta[w.status].label}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Request</DialogTitle>
            <DialogDescription>Assign a team member or vendor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assignee ID</Label>
              <Input
                id="assignedToId"
                value={assignForm.assignedToId}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, assignedToId: e.target.value }))
                }
                placeholder="User or vendor ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Assignee Type</Label>
              <Select
                value={assignForm.assignedToType}
                onValueChange={(v) =>
                  setAssignForm((f) => ({ ...f, assignedToType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assign.isPending || !assignForm.assignedToId}
            >
              {assign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <Label htmlFor="resolution">Resolution Notes</Label>
            <Textarea
              id="resolution"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="How was this resolved?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={complete.isPending}>
              {complete.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <Label htmlFor="cancelReason">Reason</Label>
            <Textarea
              id="cancelReason"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Reason for cancellation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={woOpen} onOpenChange={setWoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Work Order</DialogTitle>
            <DialogDescription>Create a vendor work order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Input
                id="vendorId"
                value={woForm.vendorId}
                onChange={(e) => setWoForm((f) => ({ ...f, vendorId: e.target.value }))}
                placeholder="Vendor ID"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={woForm.estimatedCost}
                  onChange={(e) =>
                    setWoForm((f) => ({ ...f, estimatedCost: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualCost">Actual Cost</Label>
                <Input
                  id="actualCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={woForm.actualCost}
                  onChange={(e) => setWoForm((f) => ({ ...f, actualCost: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={woForm.scheduledDate}
                  onChange={(e) =>
                    setWoForm((f) => ({ ...f, scheduledDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={woForm.status}
                  onValueChange={(v) =>
                    setWoForm((f) => ({ ...f, status: v as WorkOrderStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(woStatusMeta) as WorkOrderStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {woStatusMeta[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="woNotes">Notes</Label>
              <Textarea
                id="woNotes"
                value={woForm.notes}
                onChange={(e) => setWoForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Work order notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWo} disabled={createWorkOrder.isPending}>
              {createWorkOrder.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
  Wrench,
  Loader2,
} from "lucide-react";
import {
  useServiceRequests,
  useCreateServiceRequest,
  type ServiceRequest,
  type ServiceCategory,
  type ServicePriority,
  type ServiceStatus,
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

const statusMeta: Record<ServiceStatus, { label: string; variant: any }> = {
  open: { label: "Open", variant: "default" },
  assigned: { label: "Assigned", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const categoryMeta: Record<ServiceCategory, string> = {
  maintenance: "Maintenance",
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  landscaping: "Landscaping",
  security: "Security",
  cleaning: "Cleaning",
  elevator: "Elevator",
  pest_control: "Pest Control",
  other: "Other",
};

export default function ServiceRequestsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      status: statusFilter !== "all" ? (statusFilter as ServiceStatus) : undefined,
      priority:
        priorityFilter !== "all" ? (priorityFilter as ServicePriority) : undefined,
      category:
        categoryFilter !== "all" ? (categoryFilter as ServiceCategory) : undefined,
    }),
    [page, statusFilter, priorityFilter, categoryFilter]
  );

  const { data, isLoading, isError, refetch } = useServiceRequests(query);
  const createRequest = useCreateServiceRequest();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenantName: "",
    unitLabel: "",
    propertyId: "",
    category: "maintenance" as ServiceCategory,
    priority: "medium" as ServicePriority,
    description: "",
    scheduledAt: "",
  });

  const requests = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createRequest.mutateAsync({
        tenantName: form.tenantName || undefined,
        unitLabel: form.unitLabel || undefined,
        propertyId: form.propertyId || undefined,
        category: form.category,
        priority: form.priority,
        description: form.description,
        scheduledAt: form.scheduledAt || undefined,
        status: "open",
      });
      setOpen(false);
      setForm({
        tenantName: "",
        unitLabel: "",
        propertyId: "",
        category: "maintenance",
        priority: "medium",
        description: "",
        scheduledAt: "",
      });
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground">Maintenance and support tickets</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={createRequest.isPending}>
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-accent" /> Requests
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {(Object.keys(statusMeta) as ServiceStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusMeta[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter}
                onValueChange={(v) => {
                  setPriorityFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {(Object.keys(priorityMeta) as ServicePriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityMeta[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {(Object.keys(categoryMeta) as ServiceCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryMeta[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load requests.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Wrench className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No service requests found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Requested
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Tenant / Unit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r: ServiceRequest) => (
                      <tr
                        key={r.id}
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate({ to: `/service-requests/${r.id}` })}
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          #{r.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {categoryMeta[r.category]}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={priorityMeta[r.priority].className}>
                            {priorityMeta[r.priority].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusMeta[r.status].variant}>
                            {statusMeta[r.status].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div>{r.tenantName || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.unitLabel || "—"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {meta?.total ?? 0} total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Service Request</DialogTitle>
            <DialogDescription>Log a maintenance or support ticket.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant</Label>
                <Input
                  id="tenantName"
                  value={form.tenantName}
                  onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
                  placeholder="Tenant name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitLabel">Unit</Label>
                <Input
                  id="unitLabel"
                  value={form.unitLabel}
                  onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))}
                  placeholder="e.g. Unit 12A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID</Label>
              <Input
                id="propertyId"
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                placeholder="Property reference"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, category: v as ServiceCategory }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(categoryMeta) as ServiceCategory[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryMeta[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as ServicePriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(priorityMeta) as ServicePriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {priorityMeta[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule (optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !form.description}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

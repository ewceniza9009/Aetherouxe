import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Plus,
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
import { useProperties } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";

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
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  general: "General",
  pest: "Pest Control",
  elevator: "Elevator",
  other: "Other",
};

export default function ServiceRequestsPage() {
  const navigate = useNavigate();
  const { data: propertiesData } = useProperties({ limit: 200 });
  const { data: unitsData } = useUnits({ limit: 200 });
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const fullQuery = {
    ...query,
    status: statusFilter !== "all" ? (statusFilter as ServiceStatus) : undefined,
    priority:
      priorityFilter !== "all" ? (priorityFilter as ServicePriority) : undefined,
    category:
      categoryFilter !== "all" ? (categoryFilter as ServiceCategory) : undefined,
  };

  const { data, isLoading, isError, refetch } = useServiceRequests(fullQuery);
  const createRequest = useCreateServiceRequest();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenantId: getTenantId(),
    unitId: "",
    propertyId: "",
    category: "general" as ServiceCategory,
    priority: "medium" as ServicePriority,
    description: "",
    scheduledAt: "",
  });

  const requests = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createRequest.mutateAsync({
        tenantId: form.tenantId || undefined,
        unitId: form.unitId || undefined,
        propertyId: form.propertyId || undefined,
        category: form.category,
        priority: form.priority,
        description: form.description,
        scheduledAt: form.scheduledAt || undefined,
        status: "open",
      });
      setOpen(false);
      setForm({
        tenantId: getTenantId(),
        unitId: "",
        propertyId: "",
        category: "general",
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
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground">Maintenance and support tickets</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={createRequest.isPending}>
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search requests…"
        action={{ label: "New Request", onClick: () => setOpen(true) }}
        filters={
          <>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); resetPage(); }}
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
              onValueChange={(v) => { setPriorityFilter(v); resetPage(); }}
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
              onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}
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
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={requests.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      ID
                    </th>
                    <th {...sortHeader("category", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Category{sortIndicator("category")}
                    </th>
                    <th {...sortHeader("priority", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Priority{sortIndicator("priority")}
                    </th>
                    <th {...sortHeader("status", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("status")}
                    </th>
                    <th {...sortHeader("createdAt", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Requested{sortIndicator("createdAt")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Organization / Unit
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
                        <div>{r.tenant?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.unit?.unitNumber || "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
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
                <Label>Unit</Label>
                <Select
                  value={form.unitId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, unitId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(unitsData?.data ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property</Label>
                <Select
                  value={form.propertyId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, propertyId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(propertiesData?.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

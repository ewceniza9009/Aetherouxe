import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@elite-realty/shared-ui/components/ui";
import {
  Plus,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/agent-meta";
import {
  useAmenities,
  useCreateAmenity,
  type Amenity,
  type AmenityType,
} from "@/hooks/use-community";

const amenityTypeMeta: Record<
  AmenityType,
  { label: string; className: string }
> = {
  gym: { label: "Gym", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  pool: { label: "Pool", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  function_room: {
    label: "Function Room",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  parking: {
    label: "Parking",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  garden: { label: "Garden", className: "bg-green-100 text-green-700 border-green-200" },
  other: { label: "Other", className: "bg-muted text-muted-foreground border-border" },
};

function money(n: number) {
  return formatCurrency(Number(n ?? 0));
}

export default function AmenitiesPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fullQuery = {
    ...query,
    type: typeFilter !== "all" ? (typeFilter as AmenityType) : undefined,
  };

  const { data, isLoading, isError, refetch } = useAmenities(fullQuery);
  const createAmenity = useCreateAmenity();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "gym" as AmenityType,
    location: "",
    propertyId: "",
    capacity: "",
    hourlyRate: "",
    description: "",
  });

  const amenities = data?.data ?? [];
  const meta = data?.meta;

  const resetForm = () =>
    setForm({
      name: "",
      type: "gym",
      location: "",
      propertyId: "",
      capacity: "",
      hourlyRate: "",
      description: "",
    });

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createAmenity.mutateAsync({
        name: form.name,
        type: form.type,
        location: form.location || undefined,
        propertyId: form.propertyId || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : undefined,
        description: form.description || undefined,
        isActive: true,
      });
      setOpen(false);
      resetForm();
      refetch();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Amenities</h1>
          <p className="text-muted-foreground">Shared facilities and bookings</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={createAmenity.isPending}>
          <Plus className="mr-2 h-4 w-4" /> New Amenity
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search amenities…"
        action={{ label: "New Amenity", onClick: () => setOpen(true) }}
        filters={
          <Select
            value={typeFilter}
            onValueChange={(v) => { setTypeFilter(v); resetPage(); }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(amenityTypeMeta) as AmenityType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {amenityTypeMeta[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={amenities.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("name", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Name{sortIndicator("name")}
                    </th>
                    <th {...sortHeader("type", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Type{sortIndicator("type")}
                    </th>
                    <th {...sortHeader("capacity", "px-4 py-3 text-right text-sm font-medium text-muted-foreground")}>
                      Capacity{sortIndicator("capacity")}
                    </th>
                    <th {...sortHeader("hourlyRate", "px-4 py-3 text-right text-sm font-medium text-muted-foreground")}>
                      Hourly Rate{sortIndicator("hourlyRate")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.map((a: Amenity) => (
                    <tr
                      key={a.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/amenities/${a.id}` })}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.location || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={amenityTypeMeta[a.type].className}>
                          {amenityTypeMeta[a.type].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {a.capacity ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {a.hourlyRate != null ? money(a.hourlyRate) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {a.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
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
            <DialogTitle>New Amenity</DialogTitle>
            <DialogDescription>Add a shared facility to the portfolio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Skyline Gym"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as AmenityType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(amenityTypeMeta) as AmenityType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {amenityTypeMeta[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Tower B, Level 3"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID (optional)</Label>
              <Input
                id="propertyId"
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                placeholder="Link to a specific property"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Details about this amenity..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !form.name}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



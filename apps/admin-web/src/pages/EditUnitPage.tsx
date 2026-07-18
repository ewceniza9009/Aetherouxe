import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Trash2,
  Building2,
  KeyRound,
  Bed,
  Bath,
  Maximize,
  User,
  Calendar,
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Home,
} from "lucide-react";
import { useUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/use-units";
import { useProperty } from "@/hooks/use-properties";
import { useLeases, type Lease } from "@/hooks/use-leases";
import { formatCurrency } from "@/lib/agent-meta";

const UNIT_TYPES = [
  "studio", "one_br", "two_br", "three_br", "penthouse", "commercial", "parking",
];

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  available: { label: "Available", variant: "success" },
  occupied: { label: "Occupied", variant: "warning" },
  reserved: { label: "Reserved", variant: "secondary" },
  under_maintenance: { label: "Maintenance", variant: "destructive" },
  rented: { label: "Rented", variant: "warning" },
  sold: { label: "Sold", variant: "secondary" },
  rto_active: { label: "RTO Active", variant: "warning" },
};

export default function EditUnitPage() {
  const { propertyId, unitId } = useParams({ from: "/protected/properties/$propertyId/units/$unitId/edit" });
  const navigate = useNavigate();
  const { data: unit, isLoading } = useUnit(unitId);
  const { data: property } = useProperty(propertyId);
  const { data: leasesResult } = useLeases({ unitId, limit: 50 });
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();

  const unitLeases = useMemo(() => (leasesResult?.data ?? []) as Lease[], [leasesResult]);
  const activeLease = unitLeases.find((l) => l.status === "active");

  const [form, setForm] = useState({
    unitNumber: "",
    type: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    status: "available",
    features: "",
    listPrice: "",
    lotValue: "",
    buildingValue: "",
  });

  useEffect(() => {
    if (unit) {
      setForm({
        unitNumber: unit.unitNumber || "",
        type: unit.type || "",
        size: unit.size ? String(unit.size) : "",
        bedrooms: unit.bedrooms != null ? String(unit.bedrooms) : "",
        bathrooms: unit.bathrooms != null ? String(unit.bathrooms) : "",
        status: unit.status || "available",
        features: unit.features?.join(", ") || "",
        listPrice: unit.listPrice != null ? String(unit.listPrice) : "",
        lotValue: unit.lotValue != null ? String(unit.lotValue) : "",
        buildingValue: unit.buildingValue != null ? String(unit.buildingValue) : "",
      });
    }
  }, [unit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        id: unitId,
        unitNumber: form.unitNumber,
        type: form.type,
        status: form.status,
        size: form.size ? parseFloat(form.size) : undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : undefined,
        listPrice: form.listPrice ? parseFloat(form.listPrice) : undefined,
        lotValue: form.lotValue ? parseFloat(form.lotValue) : undefined,
        buildingValue: form.buildingValue ? parseFloat(form.buildingValue) : undefined,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await updateUnit.mutateAsync(payload);
      navigate({ to: `/properties/${propertyId}/units` });
    } catch (err) {
      console.error("Failed to update unit", err);
    }
  };

  const handleDelete = async () => {
    if (confirm("Delete this unit? This cannot be undone.")) {
      await deleteUnit.mutateAsync(unitId);
      navigate({ to: `/properties/${propertyId}/units` });
    }
  };

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/properties/${propertyId}/units` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 font-semibold">Unit not found</p>
            <p className="text-sm text-muted-foreground">This unit may have been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = STATUS_MAP[form.status] ?? { label: form.status, variant: "secondary" as const };

  return (
    <div className="space-y-6">
      {/* ── Header: back + title + actions ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: `/properties/${propertyId}/units` })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Unit {unit.unitNumber}
              </h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {property ? (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground" onClick={() => navigate({ to: `/properties/${propertyId}` })}>
                    {property.name ?? property.code}
                  </Button>
                </span>
              ) : "Edit unit details"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteUnit.isPending}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── Left: Edit form ── */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Unit Details</CardTitle>
              <CardDescription>Update the physical and classification details of this unit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Row 1: Number + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Unit Number *</Label>
                  <Input value={form.unitNumber} onChange={(e) => setForm((p) => ({ ...p, unitNumber: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))} required>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Size + Beds + Baths */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Maximize className="h-3 w-3" /> Size (sqm)</Label>
                  <Input type="number" min="0" step="0.01" value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Bed className="h-3 w-3" /> Bedrooms</Label>
                  <Input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm((p) => ({ ...p, bedrooms: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Bath className="h-3 w-3" /> Bathrooms</Label>
                  <Input type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => setForm((p) => ({ ...p, bathrooms: e.target.value }))} />
                </div>
              </div>

              {/* Row 3: Status */}
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 4: Features */}
              <div className="space-y-1.5">
                <Label className="text-xs">Features (comma-separated)</Label>
                <Textarea
                  rows={2}
                  value={form.features}
                  onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
                  placeholder="e.g. balcony, parking, city view"
                />
              </div>

              <Separator className="my-2" />

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">List Price</Label>
                  <Input type="number" min="0" step="0.01" value={form.listPrice} onChange={(e) => setForm((p) => ({ ...p, listPrice: e.target.value }))} placeholder="Total selling price" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Lot Value</Label>
                  <Input type="number" min="0" step="0.01" value={form.lotValue} onChange={(e) => setForm((p) => ({ ...p, lotValue: e.target.value }))} placeholder="Land share" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Building Value</Label>
                  <Input type="number" min="0" step="0.01" value={form.buildingValue} onChange={(e) => setForm((p) => ({ ...p, buildingValue: e.target.value }))} placeholder="Improvement value" />
                </div>
              </div>

              {/* Preview */}
              {property?.code && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Code:</span>
                  <span className="font-mono text-sm font-medium">{property.code}-{form.unitNumber || "XXX"}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => navigate({ to: `/properties/${propertyId}/units` })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUnit.isPending}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {updateUnit.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* ── Right: Unit history + summary ── */}
        <div className="space-y-6">
          {/* Quick summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Leases</span>
                <span className="font-semibold tabular-nums">{unitLeases.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Lease</span>
                {activeLease ? (
                  <button
                    className="font-semibold text-primary hover:underline"
                    onClick={() => navigate({ to: `/leases/${activeLease.id}` })}
                  >
                    {activeLease.tenantName ?? activeLease.unitLabel}
                  </button>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="tabular-nums">{new Date(unit.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Lease history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Lease History
              </CardTitle>
              <CardDescription>All leases associated with this unit.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {unitLeases.length === 0 ? (
                <div className="py-8 text-center">
                  <Home className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-2 text-xs text-muted-foreground">No lease history for this unit.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unitLeases.map((l) => (
                    <div key={l.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <button
                          className="flex items-center gap-2 text-left hover:text-primary transition-colors"
                          onClick={() => navigate({ to: `/leases/${l.id}` })}
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold text-sm">
                            {l.tenantName ?? "—"}
                          </span>
                        </button>
                        <Badge variant={l.status === "active" ? "success" : "secondary"} className="text-[10px]">
                          {l.status === "active" ? "Active" : "Closed"}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                        </span>
                        {l.monthlyRent > 0 && (
                          <span className="flex items-center gap-1">
                            {formatCurrency(l.monthlyRent)}/mo
                          </span>
                        )}
                      </div>
                      {(l as any).schemeType && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {(l as any).schemeType.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        {(l as any).mortgageScenarios && (l as any).mortgageScenarios.length > 0 && (
                          <button
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); navigate({ to: `/leases/${l.id}/mortgage/${(l as any).mortgageScenarios[0].id}` }); }}
                          >
                            Amortization <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                        {(l as any).rtoContract && (
                          <button
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); navigate({ to: `/rto/${(l as any).rtoContract.id}` }); }}
                          >
                            RTO Contract <ArrowRight className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

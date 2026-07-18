import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
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
import { useCreateUnit } from "@/hooks/use-units";
import { useProperty } from "@/hooks/use-properties";

const UNIT_TYPES = [
  "studio",
  "one_br",
  "two_br",
  "three_br",
  "penthouse",
  "commercial",
  "parking",
];

export default function NewUnitPage() {
  const { propertyId } = useParams({ from: "/protected/properties/$propertyId/units/new" });
  const navigate = useNavigate();
  const { data: property } = useProperty(propertyId);
  const createUnit = useCreateUnit();

  const [form, setForm] = useState({
    unitNumber: "",
    type: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    status: "available",
    features: "",
    buildingId: "",
    floorId: "",
    propertyId,
    listPrice: "",
    lotValue: "",
    buildingValue: "",
  });

  useEffect(() => {
    if (property) {
      setForm((p) => ({
        ...p,
        buildingId: property.buildingId || "",
        floorId: property.floorId || "",
      }));
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        propertyId: form.propertyId,
        buildingId: form.buildingId,
        floorId: form.floorId,
        unitNumber: form.unitNumber,
        unitType: form.type,
        squareMeters: form.size ? parseFloat(form.size) : undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        hasBalcony: form.features ? form.features.toLowerCase().includes("balcony") : undefined,
        hasParking: form.features ? form.features.toLowerCase().includes("parking") : undefined,
        listPrice: form.listPrice ? parseFloat(form.listPrice) : undefined,
        lotValue: form.lotValue ? parseFloat(form.lotValue) : undefined,
        buildingValue: form.buildingValue ? parseFloat(form.buildingValue) : undefined,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await createUnit.mutateAsync(payload);
      navigate({ to: `/properties/${propertyId}/units` });
    } catch (err) {
      console.error("Failed to create unit", err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/properties/${propertyId}/units` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Unit</h1>
          <p className="text-muted-foreground">
            {property ? `Adding unit to ${property.name}` : "Create a new unit"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Unit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit Number *</Label>
                <Input
                  value={form.unitNumber}
                  onChange={(e) => setForm((p) => ({ ...p, unitNumber: e.target.value }))}
                  required
                  placeholder="e.g. 101"
                />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Size (sq ft)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.size}
                  onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
                  placeholder="e.g. 500"
                />
              </div>
              <div className="space-y-2">
                <Label>Bedrooms</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.bedrooms}
                  onChange={(e) => setForm((p) => ({ ...p, bedrooms: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.bathrooms}
                  onChange={(e) => setForm((p) => ({ ...p, bathrooms: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
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

            <div className="space-y-2">
              <Label>Features (comma-separated)</Label>
              <Textarea
                value={form.features}
                onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
                placeholder="e.g. Balcony, Parking, Storage"
              />
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pricing</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>List Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.listPrice}
                    onChange={(e) => setForm((p) => ({ ...p, listPrice: e.target.value }))}
                    placeholder="Total selling price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lot Value</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.lotValue}
                    onChange={(e) => setForm((p) => ({ ...p, lotValue: e.target.value }))}
                    placeholder="Land share"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Building Value</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.buildingValue}
                    onChange={(e) => setForm((p) => ({ ...p, buildingValue: e.target.value }))}
                    placeholder="Improvement value"
                  />
                </div>
              </div>
            </div>

            {property?.code && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">Property Code Preview</p>
                <p className="font-mono text-sm font-medium">{property.code}-{form.unitNumber || "XXX"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate({ to: `/properties/${propertyId}/units` })}>
            Cancel
          </Button>
          <Button type="submit" disabled={createUnit.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createUnit.isPending ? "Saving..." : "Create Unit"}
          </Button>
        </div>
      </form>
    </div>
  );
}



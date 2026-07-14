import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
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
import { useCreateUnit } from "@/hooks/use-units";
import { useProperty } from "@/hooks/use-properties";

const UNIT_TYPES = [
  "studio",
  "1br",
  "2br",
  "3br",
  "penthouse",
  "commercial",
  "storage",
  "parking",
];

export default function NewUnitPage() {
  const { propertyId } = useParams({ from: "/properties/$propertyId/units/new" });
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...form,
        size: form.size ? parseFloat(form.size) : undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        features: form.features ? form.features.split(",").map((f) => f.trim()).filter(Boolean) : undefined,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await createUnit.mutateAsync(payload);
      navigate({ to: `/properties/${propertyId}/units` });
    } catch (err) {
      console.error("Failed to create unit", err);
    }
  };

  return (
    <div className="space-y-6">
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

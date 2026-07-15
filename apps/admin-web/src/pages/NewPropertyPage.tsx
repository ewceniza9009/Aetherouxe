import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateProperty, useUpdatePropertySpecs } from "@/hooks/use-properties";
import { PropertyType, PropertyStatus } from "@elite-realty/shared-types";

export default function NewPropertyPage() {
  const navigate = useNavigate();
  const createProperty = useCreateProperty();
  const updateSpecs = useUpdatePropertySpecs();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    type: "" as string,
    status: "available" as string,
    description: "",
    yearBuilt: "",
    lotSize: "",
    totalSquareFeet: "",
    units: "0",
  });

  const [specs, setSpecs] = useState({
    ceilingHeight: "",
    finishType: "",
    appliances: "",
    ac: "",
    flooring: "",
    smartHomeFeatures: "",
    lotArea: "",
    floorArea: "",
    bedrooms: "",
    bathrooms: "",
    garden: false,
    garage: false,
    dimensions: "",
    covered: false,
    nearbyElevator: false,
    floorPlanImage: "",
  });

  const showCondoFields = form.type === "condo_unit";
  const showHouseFields = form.type === "house_and_lot";
  const showParkingFields = form.type === "parking_slot";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: form.name,
        code: form.code,
        address: form.address,
        type: form.type,
        status: form.status,
        description: form.description,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
        lotSize: form.lotSize || undefined,
        totalSquareFeet: form.totalSquareFeet || undefined,
        units: parseInt(form.units) || 0,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const property = await createProperty.mutateAsync(payload);

      const specsPayload: any = { id: property.id, propertyId: property.id };
      if (showCondoFields) {
        specsPayload.ceilingHeight = specs.ceilingHeight || undefined;
        specsPayload.finishType = specs.finishType || undefined;
        specsPayload.appliances = specs.appliances || undefined;
        specsPayload.ac = specs.ac || undefined;
        specsPayload.flooring = specs.flooring || undefined;
        specsPayload.smartHomeFeatures = specs.smartHomeFeatures || undefined;
        specsPayload.floorPlanImage = specs.floorPlanImage || undefined;
      }
      if (showHouseFields) {
        specsPayload.lotArea = specs.lotArea || undefined;
        specsPayload.floorArea = specs.floorArea || undefined;
        specsPayload.bedrooms = specs.bedrooms ? parseInt(specs.bedrooms) : undefined;
        specsPayload.bathrooms = specs.bathrooms ? parseInt(specs.bathrooms) : undefined;
        specsPayload.garden = specs.garden;
        specsPayload.garage = specs.garage;
      }
      if (showParkingFields) {
        specsPayload.dimensions = specs.dimensions || undefined;
        specsPayload.covered = specs.covered;
        specsPayload.nearbyElevator = specs.nearbyElevator;
      }
      Object.keys(specsPayload).forEach((k) => specsPayload[k] === undefined && delete specsPayload[k]);

      if (Object.keys(specsPayload).length > 2) {
        await updateSpecs.mutateAsync(specsPayload);
      }

      navigate({ to: `/properties/${property.id}` });
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/properties" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Property</h1>
          <p className="text-muted-foreground">Create a new property record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required placeholder="e.g. Maple Towers" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Property Code *</Label>
                <Input id="code" value={form.code} onChange={(e) => updateForm("code", e.target.value)} required placeholder="e.g. PROP-001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={form.address} onChange={(e) => updateForm("address", e.target.value)} required placeholder="123 Main St, City" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select value={form.type} onValueChange={(v) => updateForm("type", v)} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PropertyType).map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PropertyStatus).map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Number of Units</Label>
                <Input id="units" type="number" min="0" value={form.units} onChange={(e) => updateForm("units", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Property description..." />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input id="yearBuilt" type="number" value={form.yearBuilt} onChange={(e) => updateForm("yearBuilt", e.target.value)} placeholder="e.g. 2020" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotSize">Lot Size</Label>
                  <Input id="lotSize" value={form.lotSize} onChange={(e) => updateForm("lotSize", e.target.value)} placeholder="e.g. 2.5 acres" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalSquareFeet">Total Square Feet</Label>
                  <Input id="totalSquareFeet" value={form.totalSquareFeet} onChange={(e) => updateForm("totalSquareFeet", e.target.value)} placeholder="e.g. 52,000 sq ft" />
                </div>
              </CardContent>
            </Card>

            {(showCondoFields || showHouseFields || showParkingFields) && (
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showCondoFields && (
                    <>
                      <div className="space-y-2">
                        <Label>Ceiling Height</Label>
                        <Input value={specs.ceilingHeight} onChange={(e) => setSpecs((s) => ({ ...s, ceilingHeight: e.target.value }))} placeholder="e.g. 10 ft" />
                      </div>
                      <div className="space-y-2">
                        <Label>Finish Type</Label>
                        <Select value={specs.finishType} onValueChange={(v) => setSpecs((s) => ({ ...s, finishType: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select finish" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bare">Bare</SelectItem>
                            <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                            <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Appliances</Label>
                        <Input value={specs.appliances} onChange={(e) => setSpecs((s) => ({ ...s, appliances: e.target.value }))} placeholder="e.g. Refrigerator, Oven" />
                      </div>
                      <div className="space-y-2">
                        <Label>AC</Label>
                        <Select value={specs.ac} onValueChange={(v) => setSpecs((s) => ({ ...s, ac: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select AC type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="central">Central</SelectItem>
                            <SelectItem value="window">Window</SelectItem>
                            <SelectItem value="split">Split</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Flooring</Label>
                        <Select value={specs.flooring} onValueChange={(v) => setSpecs((s) => ({ ...s, flooring: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select flooring" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tile">Tile</SelectItem>
                            <SelectItem value="wood">Wood</SelectItem>
                            <SelectItem value="vinyl">Vinyl</SelectItem>
                            <SelectItem value="carpet">Carpet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Smart Home Features</Label>
                        <Textarea value={specs.smartHomeFeatures} onChange={(e) => setSpecs((s) => ({ ...s, smartHomeFeatures: e.target.value }))} placeholder="List smart home features..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor Plan Image URL</Label>
                        <Input value={specs.floorPlanImage} onChange={(e) => setSpecs((s) => ({ ...s, floorPlanImage: e.target.value }))} placeholder="https://..." />
                      </div>
                    </>
                  )}
                  {showHouseFields && (
                    <>
                      <div className="space-y-2">
                        <Label>Lot Area</Label>
                        <Input value={specs.lotArea} onChange={(e) => setSpecs((s) => ({ ...s, lotArea: e.target.value }))} placeholder="e.g. 500 sqm" />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor Area</Label>
                        <Input value={specs.floorArea} onChange={(e) => setSpecs((s) => ({ ...s, floorArea: e.target.value }))} placeholder="e.g. 200 sqm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Bedrooms</Label>
                          <Input type="number" min="0" value={specs.bedrooms} onChange={(e) => setSpecs((s) => ({ ...s, bedrooms: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Bathrooms</Label>
                          <Input type="number" min="0" value={specs.bathrooms} onChange={(e) => setSpecs((s) => ({ ...s, bathrooms: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="garden" checked={specs.garden} onCheckedChange={(v: boolean) => setSpecs((s) => ({ ...s, garden: v }))} />
                          <Label htmlFor="garden">Garden</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="garage" checked={specs.garage} onCheckedChange={(v: boolean) => setSpecs((s) => ({ ...s, garage: v }))} />
                          <Label htmlFor="garage">Garage</Label>
                        </div>
                      </div>
                    </>
                  )}
                  {showParkingFields && (
                    <>
                      <div className="space-y-2">
                        <Label>Dimensions</Label>
                        <Input value={specs.dimensions} onChange={(e) => setSpecs((s) => ({ ...s, dimensions: e.target.value }))} placeholder="e.g. 2.5m x 5m" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="covered" checked={specs.covered} onCheckedChange={(v: boolean) => setSpecs((s) => ({ ...s, covered: v }))} />
                          <Label htmlFor="covered">Covered</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="nearbyElevator" checked={specs.nearbyElevator} onCheckedChange={(v: boolean) => setSpecs((s) => ({ ...s, nearbyElevator: v }))} />
                          <Label htmlFor="nearbyElevator">Nearby Elevator</Label>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/properties" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || createProperty.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Create Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}

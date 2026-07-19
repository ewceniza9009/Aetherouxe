import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Textarea } from "@elite-realty/shared-ui/components/ui";
import { Switch } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import { ArrowLeft, Save } from "lucide-react";
import { useProperty, useUpdateProperty, usePropertySpecs, useUpdatePropertySpecs } from "@/hooks/use-properties";
import { PropertyType, PropertyStatus } from "@elite-realty/shared-types";

export default function EditPropertyPage() {
  const { propertyId: id } = useParams({ from: "/protected/properties/$propertyId/edit" });
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id);
  const { data: specs } = usePropertySpecs(id);
  const updateProperty = useUpdateProperty();
  const updateSpecs = useUpdatePropertySpecs();

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    type: "",
    status: "available",
    description: "",
    yearBuilt: "",
    lotSize: "",
    totalSquareFeet: "",
    units: "0",
  });

  const [specForm, setSpecForm] = useState({
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

  useEffect(() => {
    if (property || specs) {
      setForm((prev) => ({
        ...prev,
        name: property?.name || "",
        code: property?.code || "",
        address: property?.address || "",
        type: property?.type || "",
        status: property?.status || "available",
        description: (specs as any)?.description || property?.description || "",
        yearBuilt: (specs as any)?.yearBuilt ? String((specs as any).yearBuilt) : property?.yearBuilt ? String(property.yearBuilt) : "",
        lotSize: (specs as any)?.lotSize || property?.lotSize || "",
        totalSquareFeet: (specs as any)?.totalSquareFeet || property?.totalSquareFeet || "",
        units: String(property?.units ?? 0),
      }));
    }
  }, [property, specs]);

  useEffect(() => {
    if (specs) {
      setSpecForm({
        ceilingHeight: specs.ceilingHeight || "",
        finishType: specs.finishType || "",
        appliances: specs.appliances || "",
        ac: specs.ac || "",
        flooring: specs.flooring || "",
        smartHomeFeatures: specs.smartHomeFeatures || "",
        lotArea: specs.lotArea || "",
        floorArea: specs.floorArea || "",
        bedrooms: specs.bedrooms != null ? String(specs.bedrooms) : "",
        bathrooms: specs.bathrooms != null ? String(specs.bathrooms) : "",
        garden: specs.garden ?? false,
        garage: specs.garage ?? false,
        dimensions: specs.dimensions || "",
        covered: specs.covered ?? false,
        nearbyElevator: specs.nearbyElevator ?? false,
        floorPlanImage: specs.floorPlanImage || "",
      });
    }
  }, [specs]);

  const showCondoFields = form.type === "condo_unit";
  const showHouseFields = form.type === "house_and_lot";
  const showParkingFields = form.type === "parking_slot";

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> & { id: string } = {
        id,
        propertyType: form.type || undefined,
        propertyCode: form.code || undefined,
        status: form.status || undefined,
      };
      Object.keys(payload).forEach((k) => (payload as any)[k] === undefined && delete (payload as any)[k]);
      await updateProperty.mutateAsync(payload);

      const specsPayload: Partial<import('@/hooks/use-properties').PropertySpecs> & { id: string; propertyId?: string } = { id, propertyId: id };
      if (showCondoFields) {
        specsPayload.ceilingHeight = specForm.ceilingHeight || undefined;
        specsPayload.finishType = specForm.finishType || undefined;
        specsPayload.appliances = specForm.appliances || undefined;
        specsPayload.ac = specForm.ac || undefined;
        specsPayload.flooring = specForm.flooring || undefined;
        specsPayload.smartHomeFeatures = specForm.smartHomeFeatures || undefined;
        specsPayload.floorPlanImage = specForm.floorPlanImage || undefined;
      }
      if (showHouseFields) {
        specsPayload.lotArea = specForm.lotArea || undefined;
        specsPayload.floorArea = specForm.floorArea || undefined;
        specsPayload.bedrooms = specForm.bedrooms ? parseInt(specForm.bedrooms) : undefined;
        specsPayload.bathrooms = specForm.bathrooms ? parseInt(specForm.bathrooms) : undefined;
        specsPayload.garden = specForm.garden;
        specsPayload.garage = specForm.garage;
      }
      if (showParkingFields) {
        specsPayload.dimensions = specForm.dimensions || undefined;
        specsPayload.covered = specForm.covered;
        specsPayload.nearbyElevator = specForm.nearbyElevator;
      }
      if (form.description) specsPayload.description = form.description;
      if (form.yearBuilt) specsPayload.yearBuilt = parseInt(form.yearBuilt);
      if (form.lotSize) specsPayload.lotSize = form.lotSize;
      if (form.totalSquareFeet) specsPayload.totalSquareFeet = form.totalSquareFeet;
      Object.keys(specsPayload).forEach((k) => (specsPayload as any)[k] === undefined && delete (specsPayload as any)[k]);

      if (Object.keys(specsPayload).length > 2) {
        await updateSpecs.mutateAsync(specsPayload);
      }

      navigate({ to: `/properties/${id}` });
    } catch (err) {
      console.error("Failed to update property", err);
    }
  };

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col ">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/properties" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-red-500">Property not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background flex items-center justify-between gap-4 py-3 border-b mb-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" type="button" onClick={() => navigate({ to: `/properties/${id}` })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
            <p className="text-muted-foreground">{property.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" type="button" onClick={() => navigate({ to: `/properties/${id}` })}>
            Cancel
          </Button>
          <Button type="submit" form="property-form" disabled={updateProperty.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateProperty.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <form id="property-form" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Property Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Property Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Type *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PropertyType).map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PropertyStatus).map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Number of Units</Label>
                <Input type="number" min="0" value={form.units} onChange={(e) => setForm((p) => ({ ...p, units: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
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
                  <Label>Year Built</Label>
                  <Input type="number" value={form.yearBuilt} onChange={(e) => setForm((p) => ({ ...p, yearBuilt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Lot Size</Label>
                  <Input value={form.lotSize} onChange={(e) => setForm((p) => ({ ...p, lotSize: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Total Square Feet</Label>
                  <Input value={form.totalSquareFeet} onChange={(e) => setForm((p) => ({ ...p, totalSquareFeet: e.target.value }))} />
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
                        <Input value={specForm.ceilingHeight} onChange={(e) => setSpecForm((s) => ({ ...s, ceilingHeight: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Finish Type</Label>
                        <Select value={specForm.finishType} onValueChange={(v) => setSpecForm((s) => ({ ...s, finishType: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bare">Bare</SelectItem>
                            <SelectItem value="semi_furnished">Semi Furnished</SelectItem>
                            <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Appliances</Label>
                        <Input value={specForm.appliances} onChange={(e) => setSpecForm((s) => ({ ...s, appliances: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>AC</Label>
                        <Select value={specForm.ac} onValueChange={(v) => setSpecForm((s) => ({ ...s, ac: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Select value={specForm.flooring} onValueChange={(v) => setSpecForm((s) => ({ ...s, flooring: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Textarea value={specForm.smartHomeFeatures} onChange={(e) => setSpecForm((s) => ({ ...s, smartHomeFeatures: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor Plan Image URL</Label>
                        <Input value={specForm.floorPlanImage} onChange={(e) => setSpecForm((s) => ({ ...s, floorPlanImage: e.target.value }))} />
                      </div>
                    </>
                  )}
                  {showHouseFields && (
                    <>
                      <div className="space-y-2">
                        <Label>Lot Area</Label>
                        <Input value={specForm.lotArea} onChange={(e) => setSpecForm((s) => ({ ...s, lotArea: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Floor Area</Label>
                        <Input value={specForm.floorArea} onChange={(e) => setSpecForm((s) => ({ ...s, floorArea: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Bedrooms</Label>
                          <Input type="number" min="0" value={specForm.bedrooms} onChange={(e) => setSpecForm((s) => ({ ...s, bedrooms: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Bathrooms</Label>
                          <Input type="number" min="0" value={specForm.bathrooms} onChange={(e) => setSpecForm((s) => ({ ...s, bathrooms: e.target.value }))} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="garden" checked={specForm.garden} onCheckedChange={(v: boolean) => setSpecForm((s) => ({ ...s, garden: v }))} />
                          <Label htmlFor="garden">Garden</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="garage" checked={specForm.garage} onCheckedChange={(v: boolean) => setSpecForm((s) => ({ ...s, garage: v }))} />
                          <Label htmlFor="garage">Garage</Label>
                        </div>
                      </div>
                    </>
                  )}
                  {showParkingFields && (
                    <>
                      <div className="space-y-2">
                        <Label>Dimensions</Label>
                        <Input value={specForm.dimensions} onChange={(e) => setSpecForm((s) => ({ ...s, dimensions: e.target.value }))} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="covered" checked={specForm.covered} onCheckedChange={(v: boolean) => setSpecForm((s) => ({ ...s, covered: v }))} />
                          <Label htmlFor="covered">Covered</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="nearbyElevator" checked={specForm.nearbyElevator} onCheckedChange={(v: boolean) => setSpecForm((s) => ({ ...s, nearbyElevator: v }))} />
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
          <Button variant="outline" type="button" onClick={() => navigate({ to: `/properties/${id}` })}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateProperty.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateProperty.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}



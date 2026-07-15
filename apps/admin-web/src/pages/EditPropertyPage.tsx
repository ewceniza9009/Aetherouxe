import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    if (property) {
      setForm({
        name: property.name || "",
        code: property.code || "",
        address: property.address || "",
        type: property.type || "",
        status: property.status || "available",
        description: property.description || "",
        yearBuilt: property.yearBuilt ? String(property.yearBuilt) : "",
        lotSize: property.lotSize || "",
        totalSquareFeet: property.totalSquareFeet || "",
        units: String(property.units ?? 0),
      });
    }
  }, [property]);

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
      const payload: any = {
        id,
        name: form.name,
        code: form.code,
        address: form.address,
        type: form.type,
        status: form.status,
        description: form.description || undefined,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : undefined,
        lotSize: form.lotSize || undefined,
        totalSquareFeet: form.totalSquareFeet || undefined,
        units: parseInt(form.units) || 0,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await updateProperty.mutateAsync(payload);

      const specsPayload: any = { id, propertyId: id };
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
      Object.keys(specsPayload).forEach((k) => specsPayload[k] === undefined && delete specsPayload[k]);

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
      <div className="space-y-6">
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
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/properties/${id}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
          <p className="text-muted-foreground">{property.name}</p>
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

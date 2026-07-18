import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Building2, MapPin, Users, DollarSign, Plus, FileText, Calendar, Image as ImageIcon, Upload, Trash2, ZoomIn } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useProperty, usePropertySpecs } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { formatCurrency } from "@/lib/agent-meta";
import api from "@/lib/api";

export default function PropertyDetailPage() {
  const { id } = useParams({ from: "/protected/properties/$id" });
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("overview");

  const { data: property, isLoading, error } = useProperty(id);
  const { data: specs } = usePropertySpecs(id);
  const { data: unitsResult } = useUnits({ propertyId: id, limit: 5 });

  if (error) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/properties" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-red-500">
            <p className="text-lg font-semibold">Failed to load property</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !property) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statusVariant =
    property.status === "rented"
      ? "success"
      : property.status === "available"
        ? "default"
        : property.status === "under_maintenance"
          ? "warning"
          : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/properties" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
              <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {property.code}
              </span>
            </div>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {property.address}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate({ to: `/properties/${id}/edit` })}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: `/properties/${id}/units` })}>
            <Building2 className="mr-2 h-4 w-4" /> View Units
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={statusVariant as any}>{property.status.replace(/_/g, " ")}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">{property.type.replace(/_/g, " ")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitsResult?.meta?.total ?? property.units ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {property.monthlyRevenue != null ? formatCurrency(Number(property.monthlyRevenue)) : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab} className="space-y-6">
        <Tabs.List className="flex border-b overflow-x-auto gap-2 pb-1">
          <Tabs.Trigger value="overview" className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors">Overview</Tabs.Trigger>
          <Tabs.Trigger value="showcase" className="px-4 py-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors">Showcase</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Property Code</p>
                <p className="font-mono text-sm font-medium">{property.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium capitalize">{property.type.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusVariant as any}>{property.status.replace(/_/g, " ")}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Units</p>
                <p className="font-medium">{unitsResult?.meta?.total ?? property.units ?? 0}</p>
              </div>
              {property.yearBuilt && (
                <div>
                  <p className="text-sm text-muted-foreground">Year Built</p>
                  <p className="font-medium">{property.yearBuilt}</p>
                </div>
              )}
              {property.lotSize && (
                <div>
                  <p className="text-sm text-muted-foreground">Lot Size</p>
                  <p className="font-medium">{property.lotSize}</p>
                </div>
              )}
              {property.totalSquareFeet && (
                <div>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="font-medium">{property.totalSquareFeet}</p>
                </div>
              )}
            </div>
            {property.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{property.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {specs ? (
              <div className="grid grid-cols-2 gap-4">
                {specs.ceilingHeight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ceiling Height</p>
                    <p className="font-medium">{specs.ceilingHeight}</p>
                  </div>
                )}
                {specs.finishType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Finish Type</p>
                    <p className="font-medium">{specs.finishType}</p>
                  </div>
                )}
                {specs.flooring && (
                  <div>
                    <p className="text-sm text-muted-foreground">Flooring</p>
                    <p className="font-medium">{specs.flooring}</p>
                  </div>
                )}
                {specs.appliances && (
                  <div>
                    <p className="text-sm text-muted-foreground">Appliances</p>
                    <p className="font-medium">{specs.appliances}</p>
                  </div>
                )}
                {specs.ac && (
                  <div>
                    <p className="text-sm text-muted-foreground">AC</p>
                    <p className="font-medium">{specs.ac}</p>
                  </div>
                )}
                {specs.lotArea && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lot Area</p>
                    <p className="font-medium">{specs.lotArea}</p>
                  </div>
                )}
                {specs.floorArea && (
                  <div>
                    <p className="text-sm text-muted-foreground">Floor Area</p>
                    <p className="font-medium">{specs.floorArea}</p>
                  </div>
                )}
                {specs.bedrooms != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bedrooms</p>
                    <p className="font-medium">{specs.bedrooms}</p>
                  </div>
                )}
                {specs.bathrooms != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bathrooms</p>
                    <p className="font-medium">{specs.bathrooms}</p>
                  </div>
                )}
                {specs.dimensions && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                    <p className="font-medium">{specs.dimensions}</p>
                  </div>
                )}
                {specs.garden != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Garden</p>
                    <p className="font-medium">{specs.garden ? "Yes" : "No"}</p>
                  </div>
                )}
                {specs.garage != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Garage</p>
                    <p className="font-medium">{specs.garage ? "Yes" : "No"}</p>
                  </div>
                )}
                {specs.covered != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Covered</p>
                    <p className="font-medium">{specs.covered ? "Yes" : "No"}</p>
                  </div>
                )}
                {specs.nearbyElevator != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Nearby Elevator</p>
                    <p className="font-medium">{specs.nearbyElevator ? "Yes" : "No"}</p>
                  </div>
                )}
                {specs.smartHomeFeatures && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Smart Home Features</p>
                    <p className="font-medium">{specs.smartHomeFeatures}</p>
                  </div>
                )}
                {!specs.ceilingHeight && !specs.finishType && !specs.flooring && !specs.appliances && !specs.ac && !specs.lotArea && !specs.floorArea && specs.bedrooms == null && specs.bathrooms == null && !specs.dimensions && specs.garden == null && specs.garage == null && specs.covered == null && specs.nearbyElevator == null && !specs.smartHomeFeatures && (
                  <p className="text-muted-foreground col-span-2">No specifications available.</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No specifications available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Units in this Property</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate({ to: `/properties/${id}/units` })}>
                <Building2 className="mr-2 h-4 w-4" /> View All
              </Button>
              <Button size="sm" onClick={() => navigate({ to: `/properties/${id}/units/new` })}>
                <Plus className="mr-2 h-4 w-4" /> Add Unit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!unitsResult?.data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No units yet</p>
              <p className="text-sm">
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate({ to: `/properties/${id}/units/new` })}>
                  Create the first unit
                </Button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Showing {unitsResult.data.length} of {unitsResult.meta.total} total units
              </p>
              <div className="rounded-md border scroll-grid">
                <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Unit</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Size</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Bed</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Bath</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unitsResult.data.map((unit) => (
                    <tr key={unit.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/properties/${id}/units/${unit.id}/edit` })}>
                      <td className="px-4 py-2 text-sm font-mono font-medium">{unit.unitNumber}</td>
                      <td className="px-4 py-2 text-sm"><Badge variant="secondary">{unit.type || unit.unitType || "--"}</Badge></td>
                      <td className="px-4 py-2 text-sm">{unit.size ? `${unit.size} sq ft` : unit.squareMeters ? `${unit.squareMeters} m²` : "--"}</td>
                      <td className="px-4 py-2 text-sm">{unit.bedrooms ?? "--"}</td>
                      <td className="px-4 py-2 text-sm">{unit.bathrooms ?? "--"}</td>
                      <td className="px-4 py-2 text-sm"><Badge variant={unit.status === "occupied" ? "success" : unit.status === "available" ? "default" : "secondary"}>{unit.status ?? "available"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={() => navigate({ to: `/leases?propertyId=${id}` })}>
          <FileText className="h-4 w-4" /> View Leases
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => navigate({ to: `/properties/${id}/units` })}>
          <Building2 className="h-4 w-4" /> Manage Units
        </Button>
      </div>
        </Tabs.Content>
        <Tabs.Content value="showcase">
          <ShowcaseTab property={property} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function ShowcaseTab({ property }: { property: any }) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      
      const isPrimary = (!property.images || property.images.length === 0);
      const params = new URLSearchParams();
      if (isPrimary) params.append("isPrimary", "true");

      await api.post(`/images/property/${property.id}?${params.toString()}`, formData);
      
      // Silently refresh the property data without reloading the page
      queryClient.invalidateQueries({ queryKey: ["property", property.id] });
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await api.delete(`/images/${imageId}`);
      queryClient.invalidateQueries({ queryKey: ["property", property.id] });
    } catch (err) {
      console.error(err);
      alert("Failed to delete image.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Property Showcase</h2>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload Image</>}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload} 
        />
      </div>

      {!property.images || property.images.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center">
            <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No images uploaded yet</h3>
            <p className="mt-1 max-w-md">Upload high-quality images to showcase this property to potential buyers and tenants.</p>
            <Button variant="outline" className="mt-6" onClick={() => fileInputRef.current?.click()}>
              Select a Photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {property.images.map((img: any) => (
            <Dialog key={img.id}>
              <div className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
                <img src={img.url} alt={img.alt || "Property image"} className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-sm">
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(img.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
                <img src={img.url} alt={img.alt || "Property image"} className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}


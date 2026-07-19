import { EmptyState } from '@/components/ui/empty-state';
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Separator } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import {
  ArrowLeft,
  Edit,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Plus,
  FileText,
  Calendar,
  Image as ImageIcon,
  Upload,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@elite-realty/shared-ui/components/ui';
import { useProperty, usePropertySpecs, useDeleteProperty } from '@/hooks/use-properties';
import { useUnits } from '@/hooks/use-units';
import { useAmenities } from '@/hooks/use-community';
import { formatCurrency } from '@/lib/agent-meta';
import { api } from '@elite-realty/shared-ui/lib/api';

export default function PropertyDetailPage() {
  const { id } = useParams({ from: '/protected/properties/$id' });
  const navigate = useNavigate();
  const deleteProperty = useDeleteProperty();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [tab, setTab] = React.useState('overview');

  const { data: property, isLoading, error } = useProperty(id);
  const { data: specs } = usePropertySpecs(id);
  const { data: unitsResult } = useUnits({ propertyId: id, limit: 5 });
  const { data: amenitiesResult } = useAmenities({ propertyId: id, limit: 100 });

  const description = specs?.description || property?.description;
  const yearBuilt = specs?.yearBuilt || property?.yearBuilt;
  const lotSize = specs?.lotSize || property?.lotSize;
  const totalSquareFeet = specs?.totalSquareFeet || property?.totalSquareFeet;

  if (error) {
    return (
      <div className="space-y-6 flex flex-col ">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/properties' })}>
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
    property.status === 'rented'
      ? 'success'
      : property.status === 'available'
        ? 'default'
        : property.status === 'under_maintenance'
          ? 'warning'
          : 'secondary';

  const primaryImage = property.images?.find((img: any) => img.isPrimary) || property.images?.[0];

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Compact Premium Hero Section */}
      <div className="relative rounded-xl overflow-hidden bg-card border border-border/60 shadow-sm shrink-0">
        {/* Background Image / Pattern */}
        {primaryImage ? (
          <>
            <div
              className="absolute inset-0 opacity-[0.03] dark:opacity-20 mix-blend-multiply dark:mix-blend-screen bg-cover bg-center"
              style={{ backgroundImage: `url(${primaryImage.url})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-card to-background" />
        )}

        {/* Content */}
        <div className="relative p-6 md:p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-start gap-4 w-full">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate({ to: '/properties' })}
              className="bg-background/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground backdrop-blur-md shrink-0 h-10 w-10 mt-1 rounded-full shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <Badge
                  variant={statusVariant as any}
                  className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border-0 h-5"
                >
                  {property.status.replace(/_/g, ' ')}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50 font-medium h-5 flex items-center">
                  {property.code}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-none">
                {property.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-primary" /> {property.address}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate({ to: `/properties/${id}/edit` })}
              className="bg-background/80 text-foreground border-border/60 hover:bg-muted h-9"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="h-9"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
            <Button
              size="sm"
              onClick={() => navigate({ to: `/properties/${id}/units` })}
              className="shadow-gold font-medium h-9"
            >
              <Building2 className="mr-2 h-4 w-4" /> Units
            </Button>
          </div>
        </div>

        {/* Thin Premium Stats Bar */}
        <div className="relative border-t border-border/40 bg-muted/10">
          <div className="flex flex-wrap divide-x divide-border/40">
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Type
              </span>
              <span className="text-lg font-bold text-foreground capitalize truncate">
                {property.type.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Units
              </span>
              <span className="text-lg font-bold text-foreground">
                {unitsResult?.meta?.total ?? property.units ?? 0}
              </span>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Revenue
              </span>
              <span className="text-lg font-bold text-foreground">
                {property.monthlyRevenue != null
                  ? formatCurrency(Number(property.monthlyRevenue))
                  : '--'}
              </span>
            </div>
            <div className="px-6 py-4 flex flex-col justify-center gap-1 flex-1 min-w-[120px]">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Year
              </span>
              <span className="text-lg font-bold text-foreground">{yearBuilt || '--'}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs.Root
        value={tab}
        onValueChange={setTab}
        className="flex-1 flex flex-col min-h-0 space-y-4"
      >
        <Tabs.List className="flex border-b border-border overflow-x-auto gap-8 pb-[1px] shrink-0">
          <Tabs.Trigger
            value="overview"
            className="px-2 py-3 text-sm font-bold tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all uppercase"
          >
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="showcase"
            className="px-2 py-3 text-sm font-bold tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all uppercase"
          >
            Showcase
          </Tabs.Trigger>
          <Tabs.Trigger
            value="amenities"
            className="px-2 py-3 text-sm font-bold tracking-widest border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all uppercase"
          >
            Amenities
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content
          value="overview"
          className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden"
        >
          {/* Ultra Compact Property Profile */}
          <Card className="overflow-hidden border-border/60 shadow-sm shrink-0">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/40">
                <div className="flex-1 p-5 md:p-6 flex flex-col gap-6">
                  {description ? (
                    <div className="border-b border-border/40 pb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">
                        Description
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">{description}</p>
                    </div>
                  ) : (
                    <div className="border-b border-border/40 pb-5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">
                        Description
                      </p>
                      <p className="text-sm text-muted-foreground italic">
                        No description provided.
                      </p>
                    </div>
                  )}

                  {/* Check if we have any specs to show */}
                  {!yearBuilt &&
                  !lotSize &&
                  !totalSquareFeet &&
                  !specs?.floorArea &&
                  !specs?.lotArea &&
                  specs?.bedrooms == null &&
                  specs?.bathrooms == null &&
                  !specs?.ceilingHeight &&
                  !specs?.finishType &&
                  !specs?.flooring &&
                  !specs?.appliances &&
                  !specs?.ac &&
                  !specs?.dimensions &&
                  specs?.garden == null &&
                  specs?.garage == null &&
                  specs?.covered == null &&
                  specs?.nearbyElevator == null &&
                  !specs?.smartHomeFeatures &&
                  !description ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground opacity-70">
                      <FileText className="h-6 w-6 mb-2" />
                      <p className="text-sm">No additional property details or specifications.</p>
                    </div>
                  ) : (
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-6">
                      {yearBuilt && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Year Built
                          </p>
                          <p className="text-sm font-medium">{yearBuilt}</p>
                        </div>
                      )}
                      {lotSize && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Lot Size
                          </p>
                          <p className="text-sm font-medium">{lotSize}</p>
                        </div>
                      )}
                      {totalSquareFeet && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Total Sq Ft
                          </p>
                          <p className="text-sm font-medium">{totalSquareFeet}</p>
                        </div>
                      )}
                      {specs?.floorArea && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Floor Area
                          </p>
                          <p className="text-sm font-medium">{specs.floorArea}</p>
                        </div>
                      )}
                      {specs?.lotArea && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Lot Area (Specs)
                          </p>
                          <p className="text-sm font-medium">{specs.lotArea}</p>
                        </div>
                      )}
                      {specs?.bedrooms != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Bedrooms
                          </p>
                          <p className="text-sm font-medium">{specs.bedrooms}</p>
                        </div>
                      )}
                      {specs?.bathrooms != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Bathrooms
                          </p>
                          <p className="text-sm font-medium">{specs.bathrooms}</p>
                        </div>
                      )}
                      {specs?.ceilingHeight && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Ceiling Height
                          </p>
                          <p className="text-sm font-medium">{specs.ceilingHeight}</p>
                        </div>
                      )}
                      {specs?.finishType && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Finish Type
                          </p>
                          <p className="text-sm font-medium">{specs.finishType}</p>
                        </div>
                      )}
                      {specs?.flooring && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Flooring
                          </p>
                          <p className="text-sm font-medium">{specs.flooring}</p>
                        </div>
                      )}
                      {specs?.appliances && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Appliances
                          </p>
                          <p className="text-sm font-medium">{specs.appliances}</p>
                        </div>
                      )}
                      {specs?.ac && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            AC
                          </p>
                          <p className="text-sm font-medium">{specs.ac}</p>
                        </div>
                      )}
                      {specs?.dimensions && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Dimensions
                          </p>
                          <p className="text-sm font-medium">{specs.dimensions}</p>
                        </div>
                      )}
                      {specs?.garden != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Garden
                          </p>
                          <p className="text-sm font-medium">{specs.garden ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {specs?.garage != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Garage
                          </p>
                          <p className="text-sm font-medium">{specs.garage ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {specs?.covered != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Covered
                          </p>
                          <p className="text-sm font-medium">{specs.covered ? 'Yes' : 'No'}</p>
                        </div>
                      )}
                      {specs?.nearbyElevator != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-bold">
                            Elevator Nearby
                          </p>
                          <p className="text-sm font-medium">
                            {specs.nearbyElevator ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {specs?.smartHomeFeatures && (
                    <div className="border-t border-border/40 pt-5 mt-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-bold">
                        Smart Home Features
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {specs.smartHomeFeatures}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/40 py-2.5 px-4 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold tracking-widest uppercase">
                  Units Overview
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => navigate({ to: `/leases?propertyId=${id}` })}
                  >
                    <FileText className="mr-1.5 h-3 w-3" /> Leases
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => navigate({ to: `/properties/${id}/units` })}
                  >
                    <Building2 className="mr-1.5 h-3 w-3" /> All Units
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2 shadow-sm"
                    onClick={() => navigate({ to: `/properties/${id}/units/new` })}
                  >
                    <Plus className="mr-1.5 h-3 w-3" /> Add Unit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              {!unitsResult?.data?.length ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-muted-foreground bg-muted/5">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No units yet</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs mt-1"
                    onClick={() => navigate({ to: `/properties/${id}/units/new` })}
                  >
                    Create the first unit
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-1.5 bg-muted/5 border-b border-border/40 flex justify-between items-center shrink-0">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Recent Units
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Showing {unitsResult.data.length} of {unitsResult.meta.total}
                    </p>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/10 border-b border-border/40 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            Unit
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            Size
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            Bed/Bath
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {unitsResult.data.map((unit) => (
                          <tr
                            key={unit.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer group"
                            onClick={() =>
                              navigate({ to: `/properties/${id}/units/${unit.id}/edit` })
                            }
                          >
                            <td className="px-4 py-2 font-mono font-medium text-foreground group-hover:text-primary transition-colors">
                              {unit.unitNumber}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-muted-foreground capitalize font-medium">
                                {unit.type || unit.unitType || '--'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {unit.size
                                ? `${unit.size} sq ft`
                                : unit.squareMeters
                                  ? `${unit.squareMeters} m²`
                                  : '--'}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground flex items-center gap-1.5">
                              <span>{unit.bedrooms ?? '-'}</span>
                              <span className="text-border/40 text-[10px]">|</span>
                              <span>{unit.bathrooms ?? '-'}</span>
                            </td>
                            <td className="px-4 py-2">
                              <Badge
                                variant={
                                  unit.status === 'occupied'
                                    ? 'success'
                                    : unit.status === 'available'
                                      ? 'default'
                                      : 'secondary'
                                }
                                className="shadow-none border-0 text-[10px] px-1.5 py-0 h-4"
                              >
                                {unit.status ?? 'available'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
        <Tabs.Content value="showcase">
          <ShowcaseTab property={property} />
        </Tabs.Content>

        <Tabs.Content
          value="amenities"
          className="flex-1 flex flex-col min-h-0 space-y-4 m-0 data-[state=inactive]:hidden"
        >
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/40 py-4">
              <CardTitle className="text-sm font-bold tracking-wide uppercase text-foreground/80 flex items-center justify-between">
                <span>Amenities</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {amenitiesResult?.meta?.total ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!amenitiesResult?.data || amenitiesResult.data.length === 0 ? (
                <EmptyState
                  title="No Amenities"
                  description="There are no amenities assigned to this property."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate({ to: '/amenities' })}
                    >
                      Manage Amenities
                    </Button>
                  }
                />
              ) : (
                <div className="divide-y divide-border/40">
                  {amenitiesResult.data.map((amenity: any) => (
                    <div
                      key={amenity.id}
                      className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between cursor-pointer group"
                      onClick={() => navigate({ to: `/amenities/${amenity.id}` })}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {amenity.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{amenity.type.replace(/_/g, ' ')}</span>
                          {amenity.location && (
                            <>
                              <span>•</span>
                              <span>{amenity.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        {amenity.isActive ? (
                          <Badge variant="success" className="text-[10px] h-4 py-0">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] h-4 py-0">
                            Inactive
                          </Badge>
                        )}
                        {amenity.capacity && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            Capacity: {amenity.capacity}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Property</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteProperty.mutateAsync(id);
                navigate({ to: '/properties' });
              }}
              disabled={deleteProperty.isPending}
            >
              {deleteProperty.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      formData.append('file', file);

      const isPrimary = !property.images || property.images.length === 0;
      const params = new URLSearchParams();
      if (isPrimary) params.append('isPrimary', 'true');

      await api.post(`/images/property/${property.id}?${params.toString()}`, formData);

      // Silently refresh the property data without reloading the page
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await api.delete(`/images/${imageId}`);
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
    } catch (err) {
      console.error(err);
      alert('Failed to delete image.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Property Showcase</h2>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Image
            </>
          )}
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
          <CardContent className="p-0">
            <EmptyState
              title="No images uploaded yet"
              description="Upload high-quality images to showcase this property to potential buyers and tenants."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {property.images.map((img: any) => (
            <Dialog key={img.id}>
              <div className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
                <img
                  src={img.url}
                  alt={img.alt || 'Property image'}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
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
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
                <img
                  src={img.url}
                  alt={img.alt || 'Property image'}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-md"
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}

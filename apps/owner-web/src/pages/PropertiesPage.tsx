import { Card, CardContent } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Building2, MapPin, Loader2 } from 'lucide-react';
import { useMyProperties, formatCurrency, type OwnerProperty } from '@/hooks/use-owner-portal';

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-emerald-100 text-emerald-700' },
  leased: { label: 'Leased', className: 'bg-blue-100 text-blue-700' },
  sold: { label: 'Sold', className: 'bg-gray-100 text-gray-700' },
  under_construction: { label: 'Under Construction', className: 'bg-amber-100 text-amber-700' },
};

export default function OwnerPropertiesPage() {
  const { data: properties, isLoading, isError } = useMyProperties();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
          <p className="text-muted-foreground">Failed to load properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
        <p className="text-muted-foreground">View your real estate portfolio</p>
      </div>

      {!properties || properties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No properties assigned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property: OwnerProperty) => {
            const cfg = statusConfig[property.status] ?? statusConfig.available;
            return (
              <Card key={property.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{property.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {property.propertyCode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {property.propertyType.replace(/_/g, ' ')} ·{' '}
                          {property.totalUnits > 0 ? `${property.totalUnits} units` : 'Development'}
                        </p>
                      </div>
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                      <p className="font-semibold">{formatCurrency(property.monthlyIncome)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual NOI</p>
                      <p className="font-semibold">{formatCurrency(property.annualNoi)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy</p>
                      <p className="font-semibold">
                        {property.occupancy > 0 ? `${property.occupancy}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Occupied Units</p>
                      <p className="font-semibold">
                        {property.occupiedUnits}/{property.totalUnits}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

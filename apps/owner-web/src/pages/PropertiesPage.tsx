import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Building2, MapPin } from "lucide-react";

const ownedProperties = [
  { id: "1", name: "Maple Towers", address: "123 Maple St, Portland, OR", type: "Multi-Family", units: 48, value: "$8.2M", equity: "$5.6M", noi: "$1.19M/yr", occupancy: 94, status: "leased" },
  { id: "2", name: "Oakwood Estates", address: "456 Oak Ave, Portland, OR", type: "Single Family", units: 12, value: "$4.5M", equity: "$3.2M", noi: "$432K/yr", occupancy: 100, status: "leased" },
  { id: "3", name: "Cedar Heights", address: "321 Cedar Ln, Beaverton, OR", type: "Multi-Family", units: 36, value: "$6.1M", equity: "$4.0M", noi: "$864K/yr", occupancy: 92, status: "leased" },
  { id: "4", name: "Riverfront Plaza", address: "555 River Dr, Portland, OR", type: "Commercial", units: 15, value: "$4.8M", equity: "$3.5M", noi: "$720K/yr", occupancy: 87, status: "leased" },
  { id: "5", name: "Pine Valley Ranch", address: "789 Pine Rd, Salem, OR", type: "Land", units: 0, value: "$1.2M", equity: "$1.2M", noi: "$0/yr", occupancy: 0, status: "under_construction" },
];

export default function OwnerPropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Properties</h1>
        <p className="text-muted-foreground">View your real estate portfolio</p>
      </div>

      <div className="space-y-4">
        {ownedProperties.map((property) => (
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
                      <MapPin className="h-3 w-3" /> {property.address}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{property.type} &middot; {property.units > 0 ? `${property.units} units` : "Development"}</p>
                  </div>
                </div>
                <Badge variant={property.status === "leased" ? "success" : "warning"}>
                  {property.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Market Value</p>
                  <p className="font-semibold">{property.value}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Equity</p>
                  <p className="font-semibold">{property.equity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual NOI</p>
                  <p className="font-semibold">{property.noi}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy</p>
                  <p className="font-semibold">{property.occupancy > 0 ? `${property.occupancy}%` : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



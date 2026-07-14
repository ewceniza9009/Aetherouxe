import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Phone, Mail } from "lucide-react";

const tenants = [
  { id: "1", name: "John Doe", email: "john.doe@email.com", phone: "(503) 555-0101", unit: "4B", property: "Maple Towers", status: "active", leaseEnd: "Dec 2026" },
  { id: "2", name: "Jane Smith", email: "jane.smith@email.com", phone: "(503) 555-0102", unit: "12A", property: "Oakwood Estates", status: "active", leaseEnd: "Mar 2027" },
  { id: "3", name: "Robert Johnson", email: "robert.j@email.com", phone: "(503) 555-0103", unit: "7C", property: "Cedar Heights", status: "late", leaseEnd: "Jun 2026" },
  { id: "4", name: "Emily Davis", email: "emily.d@email.com", phone: "(503) 555-0104", unit: "3", property: "Birchwood Commons", status: "active", leaseEnd: "Sep 2026" },
  { id: "5", name: "Michael Wilson", email: "michael.w@email.com", phone: "(503) 555-0105", unit: "15", property: "Riverfront Plaza", status: "pending", leaseEnd: "Feb 2027" },
];

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Manage all tenant records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Tenants</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tenants..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{tenant.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tenant.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tenant.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p>{tenant.property} - {tenant.unit}</p>
                    <p className="text-xs text-muted-foreground">Lease until {tenant.leaseEnd}</p>
                  </div>
                  <Badge variant={tenant.status === "active" ? "success" : tenant.status === "late" ? "destructive" : "warning"}>
                    {tenant.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

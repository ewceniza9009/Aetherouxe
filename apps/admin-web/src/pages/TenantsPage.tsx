import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useLeases } from "@/hooks/use-leases";

interface TenantRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  property: string;
  unit: string;
  leaseEnd: string;
  status: string;
  avatarUrl?: string | null;
}

export default function TenantsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: usersData, isLoading } = useUsers({ userType: "tenant", limit: 200 });
  const { data: leasesData } = useLeases({ limit: 500 });

  const tenants = useMemo<TenantRow[]>(() => {
    const leasesByUser = new Map<string, any>();
    (leasesData?.data ?? []).forEach((l) => {
      if (l.tenantUserId) leasesByUser.set(l.tenantUserId, l);
    });
    const users = usersData?.data ?? [];
    return users.map((u) => {
      const lease = leasesByUser.get(u.id);
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return {
        id: u.id,
        name,
        initials,
        email: u.email,
        phone: u.phone,
        property: lease?.propertyName ?? "—",
        unit: lease?.unitLabel ?? "—",
        leaseEnd: lease?.endDate ? new Date(lease.endDate).toLocaleDateString() : "—",
        status: !lease ? "no lease" : lease.status,
        avatarUrl: u.avatarUrl,
      } as TenantRow & { initials: string };
    });
  }, [usersData, leasesData]);

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.property.toLowerCase().includes(q)
    );
  });

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
              <Input
                placeholder="Search tenants..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Loading tenants…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No tenants found.</p>
          ) : (
            <div
              className="scroll-grid cursor-pointer"
              onClick={(e) => {
                const row = (e.target as HTMLElement).closest("[data-tenant-id]");
                if (row) navigate({ to: `/tenants/${row.getAttribute("data-tenant-id")}` });
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Contact</th>
                    <th>Property</th>
                    <th>Unit</th>
                    <th>Lease Until</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tenant) => (
                    <tr key={tenant.id} data-tenant-id={tenant.id} className="cursor-pointer">
                      <td className="font-medium">
                        <span className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            {tenant.avatarUrl && <AvatarImage src={tenant.avatarUrl} />}
                            <AvatarFallback className="text-xs">{(tenant as any).initials}</AvatarFallback>
                          </Avatar>
                          {tenant.name}
                        </span>
                      </td>
                      <td className="text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {tenant.email}
                          </span>
                          {tenant.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {tenant.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{tenant.property}</td>
                      <td>{tenant.unit}</td>
                      <td>{tenant.leaseEnd}</td>
                      <td className="text-right">
                        <Badge
                          variant={
                            tenant.status === "active"
                              ? "success"
                              : tenant.status === "late" ||
                                tenant.status === "rto_delinquent"
                              ? "destructive"
                              : tenant.status === "no lease"
                              ? "secondary"
                              : "warning"
                          }
                        >
                          {tenant.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

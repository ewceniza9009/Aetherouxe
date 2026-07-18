import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Phone, Mail } from "lucide-react";
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
  initials: string;
}

export default function TenantsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, query, sortHeader, sortIndicator } = listQuery;

  const { data: usersResult, isLoading } = useUsers({
    ...query,
    userType: "tenant",
  });

  const { data: leasesData } = useLeases({ limit: 500 });

  const tenants = useMemo<TenantRow[]>(() => {
    const leasesByUser = new Map<string, any>();
    (leasesData?.data ?? []).forEach((l) => {
      if (l.tenantUserId) leasesByUser.set(l.tenantUserId, l);
    });
    const users = usersResult?.data ?? [];
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
      } as TenantRow;
    });
  }, [usersResult, leasesData]);

  const meta = usersResult?.meta;

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Manage all tenant records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Tenant
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tenants..."
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={false}
            isEmpty={tenants.length === 0}
            onRetry={() => {}}
          >
            <div
              className="rounded-md border scroll-grid cursor-pointer"
              onClick={(e) => {
                const row = (e.target as HTMLElement).closest("[data-tenant-id]");
                if (row) navigate({ to: `/tenants/${row.getAttribute("data-tenant-id")}` });
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("firstName", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Tenant{sortIndicator("firstName")}
                    </th>
                    <th {...sortHeader("email", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Contact{sortIndicator("email")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Property</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Lease Until</th>
                    <th {...sortHeader("isActive", "px-4 py-3 text-right text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("isActive")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} data-tenant-id={tenant.id} className="border-b hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            {tenant.avatarUrl && <AvatarImage src={tenant.avatarUrl} />}
                            <AvatarFallback className="text-xs">{tenant.initials}</AvatarFallback>
                          </Avatar>
                          {tenant.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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
                      <td className="px-4 py-3">{tenant.property}</td>
                      <td className="px-4 py-3">{tenant.unit}</td>
                      <td className="px-4 py-3">{tenant.leaseEnd}</td>
                      <td className="px-4 py-3 text-right">
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
            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

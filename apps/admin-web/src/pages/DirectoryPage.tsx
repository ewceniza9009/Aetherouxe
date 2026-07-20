import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListQuery } from '@/hooks/use-list-query';
import { GridState } from '@/components/GridToolbar';
import { ListPager } from '@/components/ListPager';
import { Card, CardContent } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Phone, Mail, Pencil, Trash2, Search } from 'lucide-react';
import { useUsers, useDeleteUser, type AppUserType } from '@/hooks/use-users';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import { useLeases } from '@/hooks/use-leases';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@elite-realty/shared-ui/components/ui';

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  property_manager: 'Property Manager',
  finance: 'Finance',
  agent: 'Agent',
  owner: 'Owner',
  tenant: 'Tenant',
};

const roleBadgeVariant: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'
> = {
  super_admin: 'destructive',
  admin: 'destructive',
  property_manager: 'default',
  finance: 'default',
  agent: 'success',
  owner: 'warning',
  tenant: 'secondary',
};

interface DirectoryRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  userType: AppUserType;
  property: string;
  unit: string;
  leaseEnd: string;
  leaseStatus: string;
  avatarUrl?: string | null;
  initials: string;
}

export default function DirectoryPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, query, sortHeader, sortIndicator } = listQuery;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DirectoryRow | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: usersResult, isLoading } = useUsers({
    ...query,
  });

  const { data: leasesData } = useLeases({ limit: 500 });
  const deleteUser = useDeleteUser();

  const rows = useMemo<DirectoryRow[]>(() => {
    const leasesByUser = new Map<string, any>();
    (leasesData?.data ?? []).forEach((l) => {
      if (l.tenantUserId) leasesByUser.set(l.tenantUserId, l);
    });
    const users = usersResult?.data ?? [];
    return users.map((u) => {
      const lease = leasesByUser.get(u.id);
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      return {
        id: u.id,
        name,
        initials,
        email: u.email,
        phone: u.phone,
        role: roleLabel[u.userType] ?? u.userType,
        userType: u.userType,
        property: lease?.propertyName ?? '—',
        unit: lease?.unitLabel ?? '—',
        leaseEnd: lease?.endDate ? new Date(lease.endDate).toLocaleDateString() : '—',
        leaseStatus: !lease ? '—' : lease.status,
        avatarUrl: u.avatarUrl,
      } as DirectoryRow;
    });
  }, [usersResult, leasesData]);

  const filteredRows = useMemo(
    () => (roleFilter === 'all' ? rows : rows.filter((r) => r.userType === roleFilter)),
    [rows, roleFilter],
  );

  const meta = usersResult?.meta;

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteUser.mutateAsync(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }, [deleteTarget, deleteUser]);

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
          <p className="text-muted-foreground">
            All people across your portfolio — tenants, owners, agents, and staff
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Person
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directory..."
            className="pl-9 bg-transparent"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] shrink-0">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="tenant">Tenants</SelectItem>
            <SelectItem value="owner">Owners</SelectItem>
            <SelectItem value="agent">Agents</SelectItem>
            <SelectItem value="property_manager">Property Managers</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={false}
            isEmpty={filteredRows.length === 0}
            onRetry={() => {}}
          >
            <div
              className="rounded-md border scroll-grid cursor-pointer"
              onClick={(e) => {
                const row = (e.target as HTMLElement).closest('[data-row-id]');
                if (row) navigate({ to: `/tenants/${row.getAttribute('data-row-id')}` });
              }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th
                      {...sortHeader(
                        'firstName',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Name{sortIndicator('firstName')}
                    </th>
                    <th
                      {...sortHeader(
                        'email',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Contact{sortIndicator('email')}
                    </th>
                    <th
                      {...sortHeader(
                        'userType',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Role{sortIndicator('userType')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Lease Until
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      data-row-id={row.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            {row.avatarUrl && <AvatarImage src={row.avatarUrl} />}
                            <AvatarFallback className="text-xs">{row.initials}</AvatarFallback>
                          </Avatar>
                          {row.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {row.email}
                          </span>
                          {row.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {row.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant[row.userType] ?? 'secondary'}>
                          {row.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{row.property}</td>
                      <td className="px-4 py-3">{row.unit}</td>
                      <td className="px-4 py-3">{row.leaseEnd}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge
                          variant={
                            row.leaseStatus === 'active'
                              ? 'success'
                              : row.leaseStatus === 'late' || row.leaseStatus === 'rto_delinquent'
                                ? 'destructive'
                                : row.leaseStatus === '—'
                                  ? 'outline'
                                  : 'warning'
                          }
                        >
                          {row.leaseStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/tenants/${row.id}` });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(row);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Person</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

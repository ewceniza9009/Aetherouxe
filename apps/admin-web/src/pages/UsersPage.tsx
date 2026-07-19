import { useMemo, useState, useEffect } from 'react';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import { ListPager } from '@/components/ListPager';
import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Plus, Pencil, UserX } from 'lucide-react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type AppUser,
  type AppUserType,
  type CreateUserPayload,
} from '@/hooks/use-users';

const USER_TYPE_META: Record<string, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'bg-red-100 text-red-700 border-red-200' },
  admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  property_manager: {
    label: 'Property Manager',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  finance: { label: 'Finance', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  agent: { label: 'Agent', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  owner: { label: 'Owner', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  tenant: { label: 'Tenant', className: 'bg-muted text-muted-foreground border-border' },
};

const FALLBACK_META = {
  label: 'Unknown',
  className: 'bg-muted text-muted-foreground border-border',
};

function userTypeMeta(type: string) {
  return USER_TYPE_META[type] ?? { ...FALLBACK_META, label: type || 'Unknown' };
}

const USER_TYPES: AppUserType[] = [
  'super_admin',
  'admin',
  'property_manager',
  'finance',
  'agent',
  'owner',
  'tenant',
];

interface FormState {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: AppUserType;
}

const EMPTY_FORM: FormState = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  userType: 'agent',
};

export default function UsersPage() {
  const listQuery = useListQuery(10);
  const {
    search,
    setSearch,
    page,
    setPage,
    sort,
    setSort,
    order,
    setOrder,
    resetPage,
    query,
    sortHeader,
    sortIndicator,
  } = listQuery;
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<AppUser | null>(null);

  const fullQuery = useMemo(
    () => ({
      ...query,
      userType: typeFilter !== 'all' ? (typeFilter as AppUserType) : undefined,
      isActive: activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
    }),
    [query, typeFilter, activeFilter],
  );

  const { data, isLoading, isError, refetch } = useUsers(fullQuery);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = data?.data ?? [];
  const meta = data?.meta;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({
      email: u.email,
      password: '',
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      phone: u.phone ?? '',
      userType: u.userType,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateUserPayload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        userType: form.userType,
      };
      if (editing) {
        const { password, ...rest } = payload;
        await updateUser.mutateAsync({
          id: editing.id,
          ...rest,
          ...(password ? { password } : {}),
        });
      } else {
        await createUser.mutateAsync(payload);
      }
      setOpen(false);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    await deleteUser.mutateAsync(deactivateTarget.id);
    setDeactivateTarget(null);
    refetch();
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage accounts, roles and access</p>
        </div>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search name or email…"
        action={{ label: 'New User', onClick: openCreate }}
        filters={
          <>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                resetPage();
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {userTypeMeta(t).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter}
              onValueChange={(v) => {
                setActiveFilter(v);
                resetPage();
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={users.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
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
                      Email{sortIndicator('email')}
                    </th>
                    <th
                      {...sortHeader(
                        'userType',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Role{sortIndicator('userType')}
                    </th>
                    <th
                      {...sortHeader(
                        'isActive',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Status{sortIndicator('isActive')}
                    </th>
                    <th
                      {...sortHeader(
                        'createdAt',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Created{sortIndicator('createdAt')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: AppUser) => {
                    const roleMeta = userTypeMeta(u.userType);
                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              {u.avatarUrl && <AvatarImage src={u.avatarUrl} />}
                              <AvatarFallback className="text-xs">
                                {(
                                  [u.firstName, u.lastName].filter(Boolean).join(' ') ||
                                  u.email ||
                                  '—'
                                )
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.phone || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge className={roleMeta.className}>{roleMeta.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                            </Button>
                            {u.isActive && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeactivateTarget(u)}
                              >
                                <UserX className="mr-1 h-3.5 w-3.5" /> Deactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'New User'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update account details and role.' : 'Create a new user account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={form.userType}
                onValueChange={(v) => setForm((f) => ({ ...f, userType: v as AppUserType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {userTypeMeta(t).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {editing ? 'New Password (leave blank to keep)' : 'Password *'}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editing ? '••••••••' : ''}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.email || (!editing && !form.password)}
            >
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              This will disable {deactivateTarget?.email}. They will no longer be able to sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

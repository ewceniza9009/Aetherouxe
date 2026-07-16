import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Pencil,
  UserX,
} from "lucide-react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type AppUser,
  type AppUserType,
  type CreateUserPayload,
} from "@/hooks/use-users";

const USER_TYPE_META: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-red-100 text-red-700 border-red-200" },
  admin: { label: "Admin", className: "bg-purple-100 text-purple-700 border-purple-200" },
  property_manager: { label: "Property Manager", className: "bg-blue-100 text-blue-700 border-blue-200" },
  finance: { label: "Finance", className: "bg-amber-100 text-amber-700 border-amber-200" },
  agent: { label: "Agent", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  owner: { label: "Owner", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  tenant: { label: "Tenant", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

const FALLBACK_META = { label: "Unknown", className: "bg-slate-100 text-slate-700 border-slate-200" };

function userTypeMeta(type: string) {
  return USER_TYPE_META[type] ?? { ...FALLBACK_META, label: type || "Unknown" };
}

const USER_TYPES: AppUserType[] = [
  "super_admin",
  "admin",
  "property_manager",
  "finance",
  "agent",
  "owner",
  "tenant",
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
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  userType: "agent",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<AppUser | null>(null);

  const query = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      userType: (typeFilter !== "all" ? (typeFilter as AppUserType) : undefined),
      isActive: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
    }),
    [page, search, typeFilter, activeFilter]
  );

  const { data, isLoading, isError, refetch } = useUsers(query);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({
      email: u.email,
      password: "",
      firstName: u.firstName ?? "",
      lastName: u.lastName ?? "",
      phone: u.phone ?? "",
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage accounts, roles and access</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-64"
            />
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{userTypeMeta(t).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">Failed to load users.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border scroll-grid">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: AppUser) => {
                      const roleMeta = userTypeMeta(u.userType);
                      return (
                        <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.phone || ""}</div>
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
                                <Button variant="outline" size="sm" onClick={() => setDeactivateTarget(u)}>
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

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {meta?.total ?? 0} total
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "New User"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update account details and role." : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!!editing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.userType} onValueChange={(v) => setForm((f) => ({ ...f, userType: v as AppUserType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{userTypeMeta(t).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{editing ? "New Password (leave blank to keep)" : "Password *"}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editing ? "••••••••" : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.email || (!editing && !form.password)}
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Create User"}
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
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeactivate}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

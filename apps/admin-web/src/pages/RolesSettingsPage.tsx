import { EmptyState } from "@/components/ui/empty-state";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@elite-realty/shared-ui/components/ui";
import { Loader2, Plus, Shield, ShieldCheck, ShieldAlert, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";

type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
};

const AVAILABLE_PERMISSIONS = [
  { id: "manage_users", label: "Manage Users", description: "Create, update, and delete users" },
  { id: "manage_roles", label: "Manage Roles", description: "Create and update custom RBAC roles" },
  { id: "view_financials", label: "View Financials", description: "Read-only access to General Ledger & Invoices" },
  { id: "approve_disbursements", label: "Approve Disbursements", description: "Approve accounts payable disbursements" },
  { id: "manage_leases", label: "Manage Leases", description: "Create and update lease agreements" },
];

export function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/roles");
      setRoles(data.data ?? data);
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to load roles"));
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePerm = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const openCreateForm = () => {
    setName("");
    setDescription("");
    setSelectedPerms([]);
    setEditingRole(null);
    setIsCreating(true);
  };

  const openEditForm = (role: Role) => {
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPerms(role.permissions);
    setEditingRole(role);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingRole(null);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Role name is required");
    setSaving(true);
    try {
      const payload = { name, description, permissions: selectedPerms };
      if (editingRole) {
        await api.patch(`/roles/${editingRole.id}`, payload);
        toast.success("Role updated successfully");
      } else {
        await api.post("/roles", payload);
        toast.success("Role created successfully");
      }
      setIsCreating(false);
      fetchRoles();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to save role"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await api.delete(`/roles/${id}`);
      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (e) {
      toast.error(getErrorMessage(e, "Failed to delete role"));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage custom RBAC roles and granular access control</p>
        </div>
        {!isCreating && (
          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>{editingRole ? "Edit Role" : "Create New Role"}</CardTitle>
            <CardDescription>Configure the name and assign permissions for this role.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input placeholder="e.g. Junior Finance" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Optional description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                Assign Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_PERMISSIONS.map(perm => {
                  const checked = selectedPerms.includes(perm.id);
                  return (
                    <div 
                      key={perm.id} 
                      className={`flex items-start space-x-3 p-4 rounded-xl border transition-colors cursor-pointer ${checked ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => handleTogglePerm(perm.id)}
                    >
                      <Checkbox 
                        checked={checked} 
                        onCheckedChange={() => handleTogglePerm(perm.id)} 
                        className="mt-1"
                      />
                      <div className="space-y-1 select-none">
                        <Label className="font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {perm.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelForm}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRole ? "Save Changes" : "Create Role"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : roles.length === 0 ? (
            <EmptyState title="No custom roles found" description="Create your first role to start managing granular permissions." action={<Button variant="outline" onClick={openCreateForm}>Create First Role</Button>} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map(role => (
                <Card key={role.id} className="flex flex-col hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                      </div>
                      <div className="flex space-x-1 opacity-0 hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditForm(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(role.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {role.description && (
                      <CardDescription className="mt-2 line-clamp-2">{role.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 flex-1">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {role.permissions.map(perm => (
                        <Badge key={perm} variant="secondary" className="font-normal text-xs bg-muted/50">
                          {perm}
                        </Badge>
                      ))}
                      {role.permissions.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}




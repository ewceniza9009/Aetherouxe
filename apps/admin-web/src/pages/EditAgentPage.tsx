import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import {
  useAgent,
  useAgents,
  useUpdateAgent,
  type AgentTierValue,
  type LicenseStatus,
} from "@/hooks/use-agents";
import { TIER_LABELS, LICENSE_STATUS_LABELS } from "@/lib/agent-meta";

export default function EditAgentPage() {
  const { id } = useParams({ from: "/protected/agents/$id/edit" });
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(id);
  const updateAgent = useUpdateAgent();
  const { data: agentsData } = useAgents({ limit: 200 });

  const [form, setForm] = useState<null | {
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    tin: string;
    tier: AgentTierValue;
    commissionRateDefault: string;
    isInternal: boolean;
    managerId: string;
    licenseStatus: LicenseStatus;
    licenseExpiry: string;
  }>(null);

  const values = form ?? {
    name: agent?.name ?? "",
    email: agent?.email ?? "",
    phone: agent?.phone ?? "",
    licenseNumber: agent?.licenseNumber ?? "",
    tin: agent?.tin ?? "",
    tier: agent?.tier ?? ("junior" as AgentTierValue),
    commissionRateDefault: agent?.commissionRateDefault?.toString() ?? "",
    isInternal: agent?.isInternal ?? true,
    managerId: agent?.managerId ?? "",
    licenseStatus: agent?.licenseStatus ?? ("compliant" as LicenseStatus),
    licenseExpiry: agent?.licenseExpiry?.split("T")[0] ?? "",
  };

  const set = (patch: Partial<typeof values>) => setForm({ ...values, ...patch });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAgent.mutateAsync({
      id,
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      licenseNumber: values.licenseNumber || undefined,
      tin: values.tin || undefined,
      tier: values.tier,
      commissionRateDefault: values.commissionRateDefault
        ? Number(values.commissionRateDefault)
        : undefined,
      isInternal: values.isInternal,
      managerId: values.managerId || undefined,
      licenseStatus: values.licenseStatus,
      licenseExpiry: values.licenseExpiry || undefined,
    });
    navigate({ to: `/agents/${id}` });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/agents/${id}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Agent</h1>
          <p className="text-muted-foreground">{agent?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={values.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={values.email}
                  onChange={(e) => set({ email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={values.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={values.licenseNumber}
                  onChange={(e) => set({ licenseNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  value={values.tin}
                  onChange={(e) => set({ tin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">License Expiry</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={values.licenseExpiry}
                  onChange={(e) => set({ licenseExpiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tier *</Label>
                <Select
                  value={values.tier}
                  onValueChange={(v) => set({ tier: v as AgentTierValue })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["junior", "senior", "lead", "director"] as AgentTierValue[]).map(
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {TIER_LABELS[t]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Default Commission Rate (%)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.commissionRateDefault}
                  onChange={(e) => set({ commissionRateDefault: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>License Status</Label>
                <Select
                  value={values.licenseStatus}
                  onValueChange={(v) => set({ licenseStatus: v as LicenseStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["compliant", "pending", "expired", "suspended"] as LicenseStatus[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {LICENSE_STATUS_LABELS[s]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Manager</Label>
                <Select
                  value={values.managerId || "none"}
                  onValueChange={(v) => set({ managerId: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(agentsData?.data ?? [])
                      .filter((a) => a.id !== id)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={values.isInternal}
                onChange={(e) => set({ isInternal: e.target.checked })}
              />
              <Label>Internal staff agent</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate({ to: `/agents/${id}` })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateAgent.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateAgent.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useAgents, useCreateAgent, type AgentTierValue } from "@/hooks/use-agents";
import { useUsers } from "@/hooks/use-users";
import { TIER_LABELS } from "@/lib/agent-meta";

function getTenantId(): string {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.tenantId) return parsed.tenantId;
    }
  } catch {
    // ignore
  }
  return "";
}

export default function NewAgentPage() {
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const { data: agentsData } = useAgents({ limit: 200 });
  const { data: usersData } = useUsers({ limit: 200 });

  const [form, setForm] = useState({
    userId: "",
    phone: "",
    licenseNumber: "",
    tin: "",
    tier: "junior" as AgentTierValue,
    commissionRateDefault: "",
    isInternal: true,
    managerId: "",
    licenseExpiry: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createAgent.mutateAsync({
      userId: form.userId,
      tenantId: getTenantId(),
      phone: form.phone || undefined,
      licenseNumber: form.licenseNumber || undefined,
      tin: form.tin || undefined,
      tier: form.tier,
      commissionRateDefault: form.commissionRateDefault
        ? Number(form.commissionRateDefault)
        : undefined,
      isInternal: form.isInternal,
      managerId: form.managerId || undefined,
      licenseExpiry: form.licenseExpiry || undefined,
    });
    navigate({ to: `/agents/${created.id}` });
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/agents" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Agent</h1>
          <p className="text-muted-foreground">Add a staff or partner agent profile</p>
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
                <Label>Linked User *</Label>
                <Select
                  value={form.userId}
                  onValueChange={(v) => setForm((p) => ({ ...p, userId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {(usersData?.data ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                          : u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(503) 555-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="(503) 555-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  value={form.licenseNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, licenseNumber: e.target.value }))
                  }
                  placeholder="OR-RE-123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tin">TIN</Label>
                <Input
                  id="tin"
                  value={form.tin}
                  onChange={(e) => setForm((p) => ({ ...p, tin: e.target.value }))}
                  placeholder="Tax ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">License Expiry</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, licenseExpiry: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tier *</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm((p) => ({ ...p, tier: v as AgentTierValue }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["junior", "senior", "team_lead", "external_broker"] as AgentTierValue[]).map(
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
                  value={form.commissionRateDefault}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, commissionRateDefault: e.target.value }))
                  }
                  placeholder="3.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Manager</Label>
                <Select
                  value={form.managerId || "none"}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, managerId: v === "none" ? "" : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(agentsData?.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.email || a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isInternal}
                onChange={(e) => setForm((p) => ({ ...p, isInternal: e.target.checked }))}
              />
              <Label>Internal staff agent</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate({ to: "/agents" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createAgent.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {createAgent.isPending ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useCreateBuilding } from "@/hooks/use-buildings";

const BUILDING_TYPES = [
  "tower",
  "mid_rise",
  "low_rise",
  "cluster",
  "block",
];

export default function NewBuildingPage() {
  const navigate = useNavigate();
  const createBuilding = useCreateBuilding();

  const [form, setForm] = useState({
    name: "",
    type: "",
    floorCount: "0",
    address: "",
    projectId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: form.name,
        type: form.type,
        floorCount: parseInt(form.floorCount) || 0,
        address: form.address,
        projectId: form.projectId || undefined,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await createBuilding.mutateAsync(payload);
      navigate({ to: "/buildings" });
    } catch (err) {
      console.error("Failed to create building", err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/buildings" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Building</h1>
          <p className="text-muted-foreground">Add a new building to your portfolio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Building Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Building Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Tower A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))} required>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor Count</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.floorCount}
                  onChange={(e) => setForm((p) => ({ ...p, floorCount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                required
                placeholder="123 Building St, City"
              />
            </div>
            <div className="space-y-2">
              <Label>Project (optional)</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate({ to: "/buildings" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={createBuilding.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createBuilding.isPending ? "Saving..." : "Create Building"}
          </Button>
        </div>
      </form>
    </div>
  );
}

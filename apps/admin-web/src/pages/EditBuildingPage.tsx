import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import { ArrowLeft, Save } from "lucide-react";
import { useBuilding, useUpdateBuilding } from "@/hooks/use-buildings";

const BUILDING_TYPES = [
  "tower",
  "mid_rise",
  "low_rise",
  "cluster",
  "block",
];

export default function EditBuildingPage() {
  const { buildingId } = useParams({ from: "/protected/buildings/$buildingId/edit" });
  const navigate = useNavigate();
  const { data: building, isLoading } = useBuilding(buildingId);
  const updateBuilding = useUpdateBuilding();

  const [form, setForm] = useState({
    name: "",
    type: "",
    floorCount: "0",
    address: "",
    projectId: "",
  });

  useEffect(() => {
    if (building) {
      setForm({
        name: building.name || "",
        type: building.type || "",
        floorCount: String(building.floorCount ?? 0),
        address: building.address || "",
        projectId: building.projectId || "",
      });
    }
  }, [building]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        type: form.type,
        floorCount: parseInt(form.floorCount) || 0,
        address: form.address,
        projectId: form.projectId || undefined,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await updateBuilding.mutateAsync({ id: buildingId, ...payload } as Partial<import("@/hooks/use-buildings").Building> & { id: string });
      navigate({ to: "/buildings" });
    } catch (err) {
      console.error("Failed to update building", err);
    }
  };

  if (isLoading) {
    return (
    <div className="space-y-6 flex flex-col ">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/buildings" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-red-500">Building not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/buildings" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Building</h1>
          <p className="text-muted-foreground">{building.name}</p>
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
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))} required>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUILDING_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor Count</Label>
                <Input type="number" min="0" value={form.floorCount} onChange={(e) => setForm((p) => ({ ...p, floorCount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Project (optional)</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Button type="submit" disabled={updateBuilding.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateBuilding.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}



import { useState, useCallback } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { GridState } from "@/components/GridToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { useFloors, useCreateFloor, useUpdateFloor, useDeleteFloor, type Floor } from "@/hooks/use-floors";
import { useBuilding } from "@/hooks/use-buildings";

export default function FloorListPage() {
  const { buildingId } = useParams({ from: "/protected/buildings/$buildingId/floors" });
  const navigate = useNavigate();
  const { data: building } = useBuilding(buildingId);
  const { data: floors, isLoading, error } = useFloors(buildingId);
  const createFloor = useCreateFloor();
  const updateFloor = useUpdateFloor();
  const deleteFloor = useDeleteFloor();

  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);

  const handleAddFloor = useCallback(async () => {
    if (!newFloorNumber || !buildingId) return;
    try {
      await createFloor.mutateAsync({
        buildingId,
        floorNumber: newFloorNumber,
        sortOrder: (floors?.length ?? 0) + 1,
      });
      setNewFloorNumber("");
    } catch (err) {
      console.error("Failed to create floor", err);
    }
  }, [newFloorNumber, buildingId, createFloor, floors]);

  const handleMoveFloor = useCallback(async (floor: Floor, direction: "up" | "down") => {
    if (!floors) return;
    const sorted = [...floors].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((f) => f.id === floor.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    try {
      await updateFloor.mutateAsync({
        id: floor.id,
        buildingId,
        sortOrder: sorted[swapIdx].sortOrder,
      });
      await updateFloor.mutateAsync({
        id: sorted[swapIdx].id,
        buildingId,
        sortOrder: floor.sortOrder,
      });
    } catch (err) {
      console.error("Failed to reorder floor", err);
    }
  }, [floors, buildingId, updateFloor]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !buildingId) return;
    try {
      await deleteFloor.mutateAsync({ id: deleteTarget.id, buildingId });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete floor", err);
    }
  }, [deleteTarget, buildingId, deleteFloor]);

  const sortedFloors = floors ? [...floors].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/buildings" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {building ? `${building.name} - Floors` : "Floors"}
          </h1>
          <p className="text-muted-foreground">
            {building?.address ?? "Manage building floors"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Floor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="floorNumber">Floor Number</Label>
              <Input
                id="floorNumber"
                type="text"
                placeholder="e.g. 1, Ground, Basement"
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(e.target.value)}
              />
            </div>
            <Button onClick={handleAddFloor} disabled={!newFloorNumber || createFloor.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {createFloor.isPending ? "Adding..." : "Add Floor"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Floors</CardTitle>
        </CardHeader>
        <CardContent>
          <GridState
            isLoading={isLoading}
            isError={!!error}
            isEmpty={sortedFloors.length === 0}
            onRetry={() => {}}
            emptyState={
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-muted-foreground">No floors added yet</p>
                <p className="text-sm text-muted-foreground">Add a floor using the form above.</p>
              </div>
            }
          >
            <div className="space-y-2">
              {sortedFloors.map((floor, idx) => (
                <div
                  key={floor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <p className="font-medium">Floor {floor.floorNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Sort order: {floor.sortOrder} &middot; {floor.unitsCount ?? 0} unit{(floor.unitsCount ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{floor.unitsCount ?? 0} units</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => handleMoveFloor(floor, "up")}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={idx === sortedFloors.length - 1}
                      onClick={() => handleMoveFloor(floor, "down")}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteTarget(floor);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GridState>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Floor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Floor {deleteTarget?.floorNumber}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteFloor.isPending}>
              {deleteFloor.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

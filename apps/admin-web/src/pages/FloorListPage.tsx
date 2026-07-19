import { EmptyState } from "@/components/ui/empty-state";
import { useState, useCallback } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { GridState } from "@/components/GridToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@elite-realty/shared-ui/components/ui";
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
    <div className="space-y-4 flex flex-col h-[calc(100vh-6rem)] min-h-0">
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/buildings" })} className="bg-background/50 hover:bg-muted shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {building ? `${building.name} — Floors` : "Floors"}
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {building?.address ?? "Manage building floors"}
          </p>
        </div>
      </div>

      <Card className="shrink-0 border-border/60 shadow-sm overflow-hidden">
        <div className="bg-muted/10 p-4 border-b border-border/40">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="floorNumber" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Add New Floor</Label>
              <Input
                id="floorNumber"
                type="text"
                placeholder="e.g. 1, Ground, Basement"
                value={newFloorNumber}
                onChange={(e) => setNewFloorNumber(e.target.value)}
                className="bg-background shadow-sm h-10"
              />
            </div>
            <Button onClick={handleAddFloor} disabled={!newFloorNumber || createFloor.isPending} className="h-10 px-6 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              {createFloor.isPending ? "Adding..." : "Add Floor"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0 border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 py-3 px-4 shrink-0">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">All Floors</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <GridState
            isLoading={isLoading}
            isError={!!error}
            isEmpty={sortedFloors.length === 0}
            onRetry={() => {}}
            emptyState={
              <div className="text-center py-12">
                <EmptyState title="No floors added yet" />
                <p className="text-sm text-muted-foreground">Add a floor using the form above.</p>
              </div>
            }
          >
            <div className="divide-y divide-border/40">
              {sortedFloors.map((floor, idx) => (
                <div
                  key={floor.id}
                  className="flex items-center justify-between p-4 bg-background hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab transition-colors" />
                    <div>
                      <p className="font-bold text-foreground">Floor {floor.floorNumber}</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        Sort order: {floor.sortOrder} &middot; {floor.unitsCount ?? 0} unit{(floor.unitsCount ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-2 font-bold bg-muted/50 text-muted-foreground">{floor.unitsCount ?? 0} units</Badge>
                    <div className="flex items-center bg-muted/50 rounded-md p-0.5 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        disabled={idx === 0}
                        onClick={() => handleMoveFloor(floor, "up")}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-sm"
                        disabled={idx === sortedFloors.length - 1}
                        onClick={() => handleMoveFloor(floor, "down")}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-1 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      onClick={() => {
                        setDeleteTarget(floor);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
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



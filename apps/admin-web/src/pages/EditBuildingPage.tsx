import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@elite-realty/shared-ui/components/ui';
import { ArrowLeft, Save, Upload, ZoomIn, Trash2, Building2 } from 'lucide-react';
import { useBuilding, useUpdateBuilding } from '@/hooks/use-buildings';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/empty-state';

const BUILDING_TYPES = ['tower', 'mid_rise', 'low_rise', 'cluster', 'block'];

export default function EditBuildingPage() {
  const { buildingId } = useParams({ from: '/protected/buildings/$buildingId/edit' });
  const navigate = useNavigate();
  const { data: building, isLoading } = useBuilding(buildingId);
  const updateBuilding = useUpdateBuilding();

  const [form, setForm] = useState({
    name: '',
    type: '',
    floorCount: '0',
    address: '',
    projectId: '',
  });

  useEffect(() => {
    if (building) {
      setForm({
        name: building.name || '',
        type: building.type || '',
        floorCount: String(building.floorCount ?? 0),
        address: building.address || '',
        projectId: building.projectId || '',
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
      await updateBuilding.mutateAsync({ id: buildingId, ...payload } as any);
      navigate({ to: '/buildings' });
    } catch (err) {
      console.error('Failed to update building', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex flex-col">
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
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/buildings' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <p className="text-red-500">Building not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/buildings' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Building</h1>
          <p className="text-muted-foreground">{building.name}</p>
        </div>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0 space-y-4">
        <TabsList className="flex border-b border-border gap-8 pb-[1px] shrink-0 justify-start w-fit bg-transparent">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3"
          >
            Gallery ({(building as any).images?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="m-0">
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
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUILDING_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace(/_/g, ' ')}
                          </SelectItem>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project (optional)</Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(v) => setForm((p) => ({ ...p, projectId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-start gap-3 mt-6">
              <Button type="submit" disabled={updateBuilding.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateBuilding.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </TabsContent>
        <TabsContent value="gallery" className="m-0">
          <ShowcaseTab building={building} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShowcaseTab({ building }: { building: any }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const isPrimary = !building.images || building.images.length === 0;
      const params = new URLSearchParams();
      if (isPrimary) params.append('isPrimary', 'true');
      await api.post(`/images/building/${building.id}?${params.toString()}`, formData);
      queryClient.invalidateQueries({ queryKey: ['building', building.id] });
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await api.delete(`/images/${imageId}`);
      queryClient.invalidateQueries({ queryKey: ['building', building.id] });
    } catch (err) {
      console.error(err);
      alert('Failed to delete image.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Building Showcase</h2>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Image
            </>
          )}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
        />
      </div>

      {!building.images || building.images.length === 0 ? (
        <Card className="flex-1 flex flex-col min-h-0 border-0 shadow-none bg-transparent">
          <CardContent className="p-0 h-full flex flex-col flex-1">
            <EmptyState
              icon={<Building2 className="w-10 h-10" />}
              title="No images uploaded yet"
              description="Upload high-quality images to showcase this building."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {building.images.map((img: any) => (
            <Dialog key={img.id}>
              <div className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
                <img
                  src={img.url}
                  alt={img.alt || 'Building image'}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium shadow-sm">
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(img.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none">
                <img
                  src={img.url}
                  alt={img.alt || 'Building image'}
                  className="w-full h-auto rounded-lg"
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}

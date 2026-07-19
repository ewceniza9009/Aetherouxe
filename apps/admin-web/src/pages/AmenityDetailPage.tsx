import { useMemo, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import { Textarea } from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@elite-realty/shared-ui/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  MapPin,
  Users,
  Loader2,
  CalendarDays,
  Megaphone,
  Trash2,
  Pencil,
  Building2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/agent-meta';
import {
  useAmenity,
  useBookings,
  useCreateBooking,
  usePosts,
  useCreatePost,
  useDeleteAmenity,
  useUpdateAmenity,
  type Amenity,
  type AmenityType,
  type AmenityBooking,
  type CommunityPost,
  type PostType,
  type PostAudience,
} from '@/hooks/use-community';
import { useProperties } from '@/hooks/use-properties';

const amenityTypeMeta: Record<AmenityType, { label: string; className: string }> = {
  gym: { label: 'Gym', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  pool: { label: 'Pool', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  function_room: {
    label: 'Function Room',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
  },
  parking: {
    label: 'Parking',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  garden: { label: 'Garden', className: 'bg-green-100 text-green-700 border-green-200' },
  other: { label: 'Other', className: 'bg-muted text-muted-foreground border-border' },
};

const postTypeMeta: Record<string, { label: string; className: string }> = {
  announcement: {
    label: 'Announcement',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  event: { label: 'Event', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const audienceMeta: Record<string, { label: string; className: string }> = {
  all: { label: 'All', className: 'bg-muted text-muted-foreground border-border' },
  building: { label: 'Building', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  property: { label: 'Property', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  unit: { label: 'Unit', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const META_FALLBACK = {
  label: 'Unknown',
  className: 'bg-muted text-muted-foreground border-border',
};

function money(n: number) {
  return formatCurrency(Number(n ?? 0));
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AmenityDetailPage() {
  const { id } = useParams({ from: '/protected/amenities/$id' });
  const navigate = useNavigate();
  const { data: amenity, isLoading, isError } = useAmenity(id);
  const { data: propertiesData } = useProperties({ limit: 100 });
  const { data: bookingsData, isLoading: loadingBookings } = useBookings({
    amenityId: id,
    limit: 100,
  });
  const { data: postsData, isLoading: loadingPosts } = usePosts({ limit: 100 });

  const bookings = useMemo(() => (bookingsData?.data ?? []).slice().reverse(), [bookingsData]);
  const posts = postsData?.data ?? [];

  const createBooking = useCreateBooking();
  const createPost = useCreatePost();
  const deleteAmenity = useDeleteAmenity();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateAmenity = useUpdateAmenity();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'gym' as AmenityType,
    location: '',
    capacity: '',
    hourlyRate: '',
    description: '',
    propertyId: '',
  });
  const [bookingOpen, setBookingOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    tenantName: '',
    unitLabel: '',
    startDateTime: '',
    endDateTime: '',
    amount: '',
    notes: '',
  });
  const [postForm, setPostForm] = useState({
    title: '',
    body: '',
    postType: 'announcement' as PostType,
    audience: 'all' as PostAudience,
    propertyId: '',
    scheduledAt: '',
  });

  if (isError) {
    return (
      <div className="space-y-6 flex flex-col ">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/amenities' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load amenity</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !amenity) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const meta = amenityTypeMeta[amenity.type];

  const handleCreateBooking = async () => {
    await createBooking.mutateAsync({
      amenityId: amenity.id,
      tenantName: bookingForm.tenantName || undefined,
      unitLabel: bookingForm.unitLabel || undefined,
      startDateTime: bookingForm.startDateTime,
      endDateTime: bookingForm.endDateTime,
      amount: bookingForm.amount ? Number(bookingForm.amount) : undefined,
      notes: bookingForm.notes || undefined,
      status: 'confirmed',
    });
    setBookingOpen(false);
    setBookingForm({
      tenantName: '',
      unitLabel: '',
      startDateTime: '',
      endDateTime: '',
      amount: '',
      notes: '',
    });
  };

  const handleCreatePost = async () => {
    await createPost.mutateAsync({
      title: postForm.title,
      body: postForm.body,
      postType: postForm.postType,
      audience: postForm.audience,
      propertyId: postForm.propertyId || null,
      scheduledAt: postForm.scheduledAt || undefined,
      published: postForm.scheduledAt ? false : true,
      status: postForm.scheduledAt ? 'scheduled' : 'published',
    });
    setPostOpen(false);
    setPostForm({
      title: '',
      body: '',
      postType: 'announcement',
      audience: 'all',
      propertyId: '',
      scheduledAt: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/amenities' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">{amenity.name}</h1>
              <Badge className={meta.className}>{meta.label}</Badge>
              {amenity.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">{amenity.location || 'No location set'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setEditForm({
                name: amenity.name,
                type: amenity.type,
                location: amenity.location || '',
                capacity: amenity.capacity != null ? String(amenity.capacity) : '',
                hourlyRate: amenity.hourlyRate != null ? String(amenity.hourlyRate) : '',
                description: amenity.description || '',
                propertyId: amenity.propertyId || '',
              });
              setEditOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={<Building2 className="h-5 w-5" />}
          label="Property"
          value={
            amenity.property?.name || amenity.property?.propertyCode || amenity.propertyName || '—'
          }
        />
        <SummaryCard
          icon={<Users className="h-5 w-5" />}
          label="Capacity"
          value={amenity.capacity != null ? String(amenity.capacity) : '—'}
        />
        <SummaryCard
          icon={<MapPin className="h-5 w-5" />}
          label="Location"
          value={amenity.location || '—'}
        />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Hourly Rate"
          value={amenity.hourlyRate != null ? money(amenity.hourlyRate) : '—'}
        />
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bookings</CardTitle>
                  <p className="text-sm text-muted-foreground">Reservations for this amenity</p>
                </div>
                <Button size="sm" onClick={() => setBookingOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Booking
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant / Unit</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b: AmenityBooking) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-medium">{b.tenantName || '—'}</div>
                          <div className="text-xs text-muted-foreground">{b.unitLabel || '—'}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(b.startDateTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(b.endDateTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.amount != null ? money(b.amount) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === 'confirmed'
                                ? 'success'
                                : b.status === 'cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {b.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> Community Posts
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Posts related to this property/amenity
                  </p>
                </div>
                <Button size="sm" onClick={() => setPostOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {posts.map((p: CommunityPost) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-3 rounded-md border p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.title}</span>
                          <Badge className={(postTypeMeta[p.postType] ?? META_FALLBACK).className}>
                            {(postTypeMeta[p.postType] ?? META_FALLBACK).label}
                          </Badge>
                          <Badge className={(audienceMeta[p.audience] ?? META_FALLBACK).className}>
                            {(audienceMeta[p.audience] ?? META_FALLBACK).label}
                          </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.body}</p>
                      </div>
                      {!p.published && <Badge variant="warning">Scheduled</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>Amenity: {amenity.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant</Label>
                <Input
                  id="tenantName"
                  value={bookingForm.tenantName}
                  onChange={(e) => setBookingForm((f) => ({ ...f, tenantName: e.target.value }))}
                  placeholder="Tenant name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitLabel">Unit</Label>
                <Input
                  id="unitLabel"
                  value={bookingForm.unitLabel}
                  onChange={(e) => setBookingForm((f) => ({ ...f, unitLabel: e.target.value }))}
                  placeholder="e.g. Unit 12A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={bookingForm.startDateTime}
                  onChange={(e) => setBookingForm((f) => ({ ...f, startDateTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={bookingForm.endDateTime}
                  onChange={(e) => setBookingForm((f) => ({ ...f, endDateTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={bookingForm.amount}
                onChange={(e) => setBookingForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Booking notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              disabled={createBooking.isPending || !bookingForm.startDateTime}
            >
              {createBooking.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Amenity</DialogTitle>
            <DialogDescription>Update this shared facility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={editForm.type}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, type: v as AmenityType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(amenityTypeMeta) as AmenityType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {amenityTypeMeta[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="0"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hourlyRate">Hourly Rate</Label>
                <Input
                  id="edit-hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.hourlyRate}
                  onChange={(e) => setEditForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-propertyId">Property (optional)</Label>
              <Select
                value={editForm.propertyId || 'none'}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, propertyId: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None / Global</SelectItem>
                  {propertiesData?.data.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await updateAmenity.mutateAsync({
                  id: amenity.id,
                  name: editForm.name,
                  type: editForm.type,
                  location: editForm.location || undefined,
                  capacity: editForm.capacity ? Number(editForm.capacity) : undefined,
                  hourlyRate: editForm.hourlyRate ? Number(editForm.hourlyRate) : undefined,
                  description: editForm.description || undefined,
                  propertyId: editForm.propertyId || null,
                });
                setEditOpen(false);
              }}
              disabled={updateAmenity.isPending || !editForm.name}
            >
              {updateAmenity.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Amenity</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteAmenity.mutateAsync(id);
                navigate({ to: '/amenities' });
              }}
              disabled={deleteAmenity.isPending}
            >
              {deleteAmenity.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Post</DialogTitle>
            <DialogDescription>Publish to the community feed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={postForm.title}
                onChange={(e) => setPostForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Post title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={postForm.postType}
                  onValueChange={(v) => setPostForm((f) => ({ ...f, postType: v as PostType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(postTypeMeta) as PostType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {postTypeMeta[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={postForm.audience}
                  onValueChange={(v) => setPostForm((f) => ({ ...f, audience: v as PostAudience }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(audienceMeta) as PostAudience[]).map((a) => (
                      <SelectItem key={a} value={a}>
                        {audienceMeta[a].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property (optional)</Label>
                <Select
                  value={postForm.propertyId || 'none'}
                  onValueChange={(v) =>
                    setPostForm((f) => ({ ...f, propertyId: v === 'none' ? '' : v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Global</SelectItem>
                    {propertiesData?.data.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={postForm.scheduledAt}
                  onChange={(e) => setPostForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body *</Label>
              <Textarea
                id="body"
                value={postForm.body}
                onChange={(e) => setPostForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Post content..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={createPost.isPending || !postForm.title || !postForm.body}
            >
              {createPost.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

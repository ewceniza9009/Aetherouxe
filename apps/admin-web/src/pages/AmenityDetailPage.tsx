import { useMemo, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  MapPin,
  Users,
  Loader2,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import { formatCurrency } from "@/lib/agent-meta";
import {
  useAmenity,
  useBookings,
  useCreateBooking,
  usePosts,
  useCreatePost,
  type AmenityType,
  type AmenityBooking,
  type CommunityPost,
  type PostType,
  type PostAudience,
} from "@/hooks/use-community";

const amenityTypeMeta: Record<AmenityType, { label: string; className: string }> = {
  gym: { label: "Gym", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  pool: { label: "Pool", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  function_room: {
    label: "Function Room",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  parking: {
    label: "Parking",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  garden: { label: "Garden", className: "bg-green-100 text-green-700 border-green-200" },
  other: { label: "Other", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

const postTypeMeta: Record<string, { label: string; className: string }> = {
  announcement: {
    label: "Announcement",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  event: { label: "Event", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

const audienceMeta: Record<string, { label: string; className: string }> = {
  all: { label: "All", className: "bg-slate-100 text-slate-700 border-slate-200" },
  building: { label: "Building", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  property: { label: "Property", className: "bg-amber-100 text-amber-700 border-amber-200" },
  unit: { label: "Unit", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const META_FALLBACK = { label: "Unknown", className: "bg-slate-100 text-slate-700 border-slate-200" };

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
  const { id } = useParams({ from: "/protected/amenities/$id" });
  const navigate = useNavigate();
  const { data: amenity, isLoading, isError } = useAmenity(id);
  const { data: bookingsData, isLoading: loadingBookings } = useBookings({
    amenityId: id,
    limit: 100,
  });
  const { data: postsData, isLoading: loadingPosts } = usePosts({ limit: 100 });

  const bookings = useMemo(
    () => (bookingsData?.data ?? []).slice().reverse(),
    [bookingsData]
  );
  const posts = postsData?.data ?? [];

  const createBooking = useCreateBooking();
  const createPost = useCreatePost();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    tenantName: "",
    unitLabel: "",
    startDateTime: "",
    endDateTime: "",
    amount: "",
    notes: "",
  });
  const [postForm, setPostForm] = useState({
    title: "",
    body: "",
    postType: "announcement" as PostType,
    audience: "all" as PostAudience,
    propertyId: "",
    scheduledAt: "",
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/amenities" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
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
      status: "confirmed",
    });
    setBookingOpen(false);
    setBookingForm({
      tenantName: "",
      unitLabel: "",
      startDateTime: "",
      endDateTime: "",
      amount: "",
      notes: "",
    });
  };

  const handleCreatePost = async () => {
    await createPost.mutateAsync({
      title: postForm.title,
      body: postForm.body,
      postType: postForm.postType,
      audience: postForm.audience,
      propertyId: postForm.propertyId || undefined,
      scheduledAt: postForm.scheduledAt || undefined,
      published: postForm.scheduledAt ? false : true,
      status: postForm.scheduledAt ? "scheduled" : "published",
    });
    setPostOpen(false);
    setPostForm({
      title: "",
      body: "",
      postType: "announcement",
      audience: "all",
      propertyId: "",
      scheduledAt: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/amenities" })}>
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
            <p className="text-muted-foreground mt-1">
              {amenity.location || "No location set"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Users className="h-5 w-5" />}
          label="Capacity"
          value={amenity.capacity != null ? String(amenity.capacity) : "—"}
        />
        <SummaryCard
          icon={<MapPin className="h-5 w-5" />}
          label="Location"
          value={amenity.location || "—"}
        />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Hourly Rate"
          value={amenity.hourlyRate != null ? money(amenity.hourlyRate) : "—"}
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
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No bookings yet.
                </p>
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
                          <div className="font-medium">{b.tenantName || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {b.unitLabel || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(b.startDateTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(b.endDateTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.amount != null ? money(b.amount) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === "confirmed"
                                ? "success"
                                : b.status === "cancelled"
                                ? "destructive"
                                : "secondary"
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
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No posts yet.
                </p>
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
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {p.body}
                        </p>
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
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, tenantName: e.target.value }))
                  }
                  placeholder="Tenant name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitLabel">Unit</Label>
                <Input
                  id="unitLabel"
                  value={bookingForm.unitLabel}
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, unitLabel: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, startDateTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={bookingForm.endDateTime}
                  onChange={(e) =>
                    setBookingForm((f) => ({ ...f, endDateTime: e.target.value }))
                  }
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
              {createBooking.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
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
                  onValueChange={(v) =>
                    setPostForm((f) => ({ ...f, audience: v as PostAudience }))
                  }
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
                <Label htmlFor="propertyId">Property ID</Label>
                <Input
                  id="propertyId"
                  value={postForm.propertyId}
                  onChange={(e) =>
                    setPostForm((f) => ({ ...f, propertyId: e.target.value }))
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Schedule (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={postForm.scheduledAt}
                  onChange={(e) =>
                    setPostForm((f) => ({ ...f, scheduledAt: e.target.value }))
                  }
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
              {createPost.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


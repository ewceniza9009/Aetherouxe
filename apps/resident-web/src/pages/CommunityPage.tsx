import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Textarea } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import {
  Users,
  CalendarDays,
  Dumbbell,
  BookOpen,
  Pin,
  CalendarPlus,
  Loader2,
  Megaphone,
  PartyPopper,
  Info,
  TriangleAlert,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  useCommunityPosts,
  useAmenities,
  useMyBookings,
  useCreateBooking,
  AMENITY_TYPE_STYLES,
  POST_TYPE_STYLES,
  BOOKING_STATUS_STYLES,
  formatDate,
  formatDateTime,
  type Amenity,
  type CommunityPost,
  type AmenityBooking,
} from "@/hooks/use-resident-portal";

const postIcon: Record<CommunityPost["postType"], React.ReactNode> = {
  announcement: <Megaphone className="h-4 w-4" />,
  event: <PartyPopper className="h-4 w-4" />,
  general: <Info className="h-4 w-4" />,
  alert: <TriangleAlert className="h-4 w-4" />,
};

const bookingIcon: Record<AmenityBooking["status"], React.ReactNode> = {
  requested: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle2 className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

function BookingDialog({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const [amenityId, setAmenityId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const createBooking = useCreateBooking();

  const reset = () => {
    setAmenityId("");
    setStart("");
    setEnd("");
    setNotes("");
  };

  const canSubmit = amenityId && start && end && new Date(end) > new Date(start);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await createBooking.mutateAsync({ amenityId, startDateTime: start, endDateTime: end, notes: notes || undefined });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <CalendarPlus className="mr-2 h-4 w-4" /> Book Amenity
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book an Amenity</DialogTitle>
          <DialogDescription>Reserve a shared space. Requests are reviewed by management.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Amenity</Label>
            <Select value={amenityId} onValueChange={setAmenityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an amenity" />
              </SelectTrigger>
              <SelectContent>
                {amenities.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Anything management should know..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {start && end && new Date(end) <= new Date(start) && (
            <p className="text-xs text-destructive">End time must be after the start time.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); setOpen(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createBooking.isPending}>
            {createBooking.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const { data: posts, isLoading: postsLoading } = useCommunityPosts();
  const { data: amenities, isLoading: amenitiesLoading } = useAmenities();
  const { data: bookings, isLoading: bookingsLoading } = useMyBookings();

  const activeAmenities = (amenities ?? []).filter((a) => a.isActive);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">Stay connected with neighbors, amenities, and events</p>
      </div>

      {/* Section A: Community Posts / Events */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold font-serif">Posts &amp; Events</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest from Management &amp; Neighbors</CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <SectionSkeleton />
            ) : !posts || posts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <p className="font-medium">No posts yet</p>
                <p className="text-sm text-muted-foreground">Community announcements will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => {
                  const type = POST_TYPE_STYLES[post.postType];
                  return (
                    <div
                      key={post.id}
                      className={`p-4 rounded-lg border ${post.isPinned ? "bg-primary/5 border-primary/20" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
                          <h3 className="font-semibold text-sm">{post.title}</h3>
                          <Badge variant="outline" className={type.className}>
                            <span className="flex items-center gap-1">
                              {postIcon[post.postType]}
                              {type.label}
                            </span>
                          </Badge>
                        </div>
                        {post.scheduledDate && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(post.scheduledDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                      {(post.author || post.audience) && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {post.author && <span>By {post.author}</span>}
                          {post.author && post.audience && <span> &middot; </span>}
                          {post.audience && <span>To {post.audience}</span>}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Section B: Amenities */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold font-serif">Amenities</h2>
        </div>
        {amenitiesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : !activeAmenities || activeAmenities.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Dumbbell className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium">No amenities available</p>
              <p className="text-sm text-muted-foreground">Check back later for bookable spaces.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeAmenities.map((amenity) => {
              const type = AMENITY_TYPE_STYLES[amenity.amenityType];
              return (
                <Card key={amenity.id} className="hover:border-primary/30 transition-all">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base leading-tight">{amenity.name}</CardTitle>
                        {amenity.location && (
                          <CardDescription className="text-xs">{amenity.location}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={type.className}>
                      {type.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {amenity.description || "Available for resident booking."}
                    </p>
                    {amenity.capacity != null && (
                      <p className="text-xs text-muted-foreground">Capacity: {amenity.capacity}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Section C: My Bookings */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold font-serif">My Bookings</h2>
          </div>
          <BookingDialog amenities={activeAmenities} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Amenity Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <SectionSkeleton rows={2} />
            ) : !bookings || bookings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <CalendarDays className="h-7 w-7 text-primary" />
                </div>
                <p className="font-medium">No bookings yet</p>
                <p className="text-sm text-muted-foreground">Reserve an amenity above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const status = BOOKING_STATUS_STYLES[b.status];
                  return (
                    <div key={b.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <CalendarDays className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{b.amenityName || "Amenity"}</p>
                            <Badge variant="outline" className={status.className}>
                              <span className="flex items-center gap-1">
                                {bookingIcon[b.status]}
                                {status.label}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(b.startDateTime)} &rarr; {formatDateTime(b.endDateTime)}
                          </p>
                          {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">“{b.notes}”</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}



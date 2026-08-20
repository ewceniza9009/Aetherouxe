import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useAuth } from '@elite-realty/shared-ui/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { formatCurrency } from '@elite-realty/shared-ui/lib/utils';
import {
  Calendar,
  Clock,
  Dumbbell,
  Waves,
  Trees,
  Tv,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

interface AmenityItem {
  id: string;
  name: string;
  amenityType: string;
  description?: string;
  location?: string;
  capacity?: number;
  hourlyRate?: number;
  isActive: boolean;
  property?: { name: string };
}

interface BookingItem {
  id: string;
  amenityId: string;
  tenantName: string;
  bookingStart: string;
  bookingEnd: string;
  totalAmount?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | string;
  notes?: string;
  amenity?: { name: string; location?: string };
}

export default function ResidentAmenitiesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedAmenity, setSelectedAmenity] = useState<AmenityItem | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [specialNotes, setSpecialNotes] = useState('');

  // Fetch Amenities
  const { data: amenitiesRes, isLoading } = useQuery({
    queryKey: ['resident-amenities-list'],
    queryFn: async () => {
      const res = await api.get('/amenities?limit=50');
      return res.data;
    },
  });

  // Fetch Bookings
  const { data: bookingsRes } = useQuery({
    queryKey: ['resident-amenity-bookings'],
    queryFn: async () => {
      const res = await api.get('/amenity-bookings?limit=50');
      return res.data;
    },
  });

  const amenities: AmenityItem[] = amenitiesRes?.data ?? [];
  const bookings: BookingItem[] = bookingsRes?.data ?? [];

  // Calculate estimated total fee
  const startHour = parseInt(startTime.split(':')[0], 10) || 0;
  const endHour = parseInt(endTime.split(':')[0], 10) || 0;
  const durationHours = Math.max(1, endHour - startHour);
  const estimatedCost = selectedAmenity?.hourlyRate
    ? Number(selectedAmenity.hourlyRate) * durationHours
    : 0;

  // Book Amenity Mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAmenity) return;
      const startDateTime = new Date(`${bookingDate}T${startTime}:00.000Z`).toISOString();
      const endDateTime = new Date(`${bookingDate}T${endTime}:00.000Z`).toISOString();

      const res = await api.post('/amenity-bookings', {
        amenityId: selectedAmenity.id,
        tenantName: user ? `${user.firstName} ${user.lastName}` : 'Resident User',
        tenantId: user?.id,
        bookingStart: startDateTime,
        bookingEnd: endDateTime,
        totalAmount: estimatedCost,
        notes: specialNotes ? `Guests: ${guestCount}. ${specialNotes}` : `Guests: ${guestCount}`,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`Successfully booked ${selectedAmenity?.name}! Confirmation recorded.`);
      setBookingModalOpen(false);
      setSelectedAmenity(null);
      setSpecialNotes('');
      queryClient.invalidateQueries({ queryKey: ['resident-amenity-bookings'] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Failed to book amenity. Please choose another slot.',
      );
    },
  });

  const getAmenityIcon = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'gym':
      case 'fitness':
        return <Dumbbell className="h-6 w-6 text-emerald-400" />;
      case 'pool':
      case 'swimming':
        return <Waves className="h-6 w-6 text-sky-400" />;
      case 'park':
      case 'garden':
        return <Trees className="h-6 w-6 text-emerald-400" />;
      case 'cinema':
      case 'theater':
      case 'screening_room':
        return <Tv className="h-6 w-6 text-indigo-400" />;
      default:
        return <Sparkles className="h-6 w-6 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Community Amenities &amp; Leisure
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              Resident Privileges
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Reserve private lounges, fitness suites, infinity pools, and event spaces with instant
            collision checks.
          </p>
        </div>
      </div>

      {/* Amenity Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {amenities.map((amenity) => (
          <Card
            key={amenity.id}
            className="bg-card border-border/80 hover:border-primary/50 transition-all shadow-md flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60">
                  {getAmenityIcon(amenity.amenityType)}
                </div>
                <Badge
                  variant="outline"
                  className={
                    amenity.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs'
                  }
                >
                  {amenity.isActive ? 'Available' : 'Maintenance'}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-foreground mt-3 leading-snug">
                {amenity.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {amenity.description ||
                  'Exclusive community facility for residents and accompanied guests.'}
              </p>

              <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Location:</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {amenity.location || 'Clubhouse'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Max Capacity:</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {amenity.capacity || 20} persons
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Fee / Rate:</span>
                  </span>
                  <span className="font-bold text-emerald-400">
                    {amenity.hourlyRate && Number(amenity.hourlyRate) > 0
                      ? `${formatCurrency(Number(amenity.hourlyRate))}/hr`
                      : 'Complimentary'}
                  </span>
                </div>
              </div>

              <Button
                disabled={!amenity.isActive}
                onClick={() => {
                  setSelectedAmenity(amenity);
                  setBookingModalOpen(true);
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                Reserve Facility
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resident Active Bookings */}
      <Card className="border-border/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">
                My Upcoming Reservations
              </CardTitle>
              <CardDescription>
                Confirmed time slots and access passes for your household
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {bookings.length} Bookings
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground italic">
              No active amenity bookings scheduled. Select a facility above to reserve.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border border-border/70 hover:border-border transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">
                        {b.amenity?.name || 'Amenity Space'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {new Date(b.bookingStart).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>
                          {new Date(b.bookingStart).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(b.bookingEnd).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {b.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {b.totalAmount && Number(b.totalAmount) > 0 ? (
                      <span className="text-xs font-bold text-emerald-400">
                        {formatCurrency(Number(b.totalAmount))}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Free Pass
                      </Badge>
                    )}
                    <Badge
                      className={
                        b.status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs'
                      }
                    >
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {bookingModalOpen && selectedAmenity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Book {selectedAmenity.name}</h3>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">
                  Booking Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">
                  Expected Guests (Max {selectedAmenity.capacity || 20})
                </label>
                <input
                  type="number"
                  value={guestCount}
                  min={1}
                  max={selectedAmenity.capacity || 50}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">
                  Event Notes (Optional)
                </label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Birthday celebration, audiovisual setup needed..."
                  rows={2}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-foreground outline-none focus:border-primary"
                />
              </div>

              {/* Fee summary banner */}
              <div className="p-3 rounded-xl bg-muted/50 border border-border/80 flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Total Fee:</span>
                <span className="text-sm font-black text-emerald-400">
                  {estimatedCost > 0 ? formatCurrency(estimatedCost) : 'Complimentary (Free)'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={bookMutation.isPending}
                onClick={() => bookMutation.mutate()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
              >
                {bookMutation.isPending ? 'Checking Slots...' : 'Confirm Reservation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

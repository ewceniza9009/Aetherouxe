import React from 'react';
import { formatCurrency } from '@elite-realty/shared-ui/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { useNavigate } from '@tanstack/react-router';
import {
  DollarSign,
  Wrench,
  Bell,
  FileText,
  AlertCircle,
  Calculator,
  CalendarClock,
  Home,
  ArrowRight,
  Plus,
  Sparkles,
  Layers,
  CreditCard,
  Calendar,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { BuildingDigitalTwin } from '@elite-realty/shared-ui';
import { useMyLease, useLeasePayments } from '@/hooks/use-leases';
import {
  useCommunityPosts,
  useMyServiceRequests,
  SERVICE_STATUS_STYLES,
  formatDate,
} from '@/hooks/use-resident-portal';
import { useMyRto } from '@/hooks/use-rto';

export default function ResidentDashboardPage() {
  const navigate = useNavigate();
  const { data: lease, isLoading: leaseLoading } = useMyLease();
  const { data: payments, isLoading: paymentsLoading } = useLeasePayments(lease?.id ?? '');
  const { data: posts, isLoading: postsLoading } = useCommunityPosts();
  const { data: requests, isLoading: requestsLoading } = useMyServiceRequests();
  const { data: rto, isLoading: rtoLoading } = useMyRto();

  const nextPayment = (payments ?? [])
    .filter((p) => p.status !== 'paid')
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())[0];

  const activeRequests = (requests ?? []).filter(
    (r) => r.status === 'submitted' || r.status === 'in_progress' || r.status === 'scheduled',
  );

  const leaseEnd = lease ? new Date(lease.endDate) : null;
  const today = new Date();
  const monthsRemaining = leaseEnd
    ? Math.max(
        0,
        (leaseEnd.getFullYear() - today.getFullYear()) * 12 +
          (leaseEnd.getMonth() - today.getMonth()),
      )
    : 0;

  const propertyName = lease?.propertyName || 'Elite Residence Towers';
  const unitLabel = lease?.unitLabel || 'Penthouse 1204';

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Hero Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/60 p-6 sm:p-8 shadow-2xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active Resident
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                {propertyName}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome Home, <span className="text-emerald-400">Unit {unitLabel}</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Access 24/7 concierge services, interactive building 3D digital twins, real-time
              amenity reservations, and automated rent settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate({ to: '/payments' })}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 gap-2 px-5 py-2.5 rounded-xl transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Pay Rent
            </Button>
            <Button
              onClick={() => navigate({ to: '/amenities' })}
              variant="outline"
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-600 gap-2 px-4 py-2.5 rounded-xl transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Book Amenity
            </Button>
            <Button
              onClick={() => navigate({ to: '/service-requests' })}
              variant="outline"
              className="bg-slate-800/80 hover:bg-slate-700 text-white border-slate-600 gap-2 px-4 py-2.5 rounded-xl transition-all"
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              Maintenance
            </Button>
          </div>
        </div>

        {/* Ambient Glow Background Effect */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Next Payment Card */}
        <Card className="bg-card border-border/70 hover:border-emerald-500/40 transition-all shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Rent Due
            </CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div>
                <div className="text-2xl font-black text-foreground">
                  {formatCurrency(Number(nextPayment?.amount ?? lease?.monthlyRent ?? 35000))}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {nextPayment?.dueDate
                      ? `Due ${new Date(nextPayment.dueDate).toLocaleDateString()}`
                      : 'Monthly schedule active'}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lease Duration Card */}
        <Card className="bg-card border-border/70 hover:border-sky-500/40 transition-all shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lease Duration
            </CardTitle>
            <CalendarClock className="w-4 h-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            {leaseLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-black text-sky-400">
                  {monthsRemaining > 0 ? `${monthsRemaining} Months` : 'Active'}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    {leaseEnd ? `Expires ${leaseEnd.toLocaleDateString()}` : 'Standard 1-Year'}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Requests Card */}
        <Card className="bg-card border-border/70 hover:border-amber-500/40 transition-all shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Tickets
            </CardTitle>
            <Wrench className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-black text-amber-400">{activeRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeRequests.length === 0
                      ? 'All systems operational'
                      : 'Work order in progress'}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Notices Card */}
        <Card className="bg-card border-border/70 hover:border-indigo-500/40 transition-all shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Community Notices
            </CardTitle>
            <Bell className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-black text-foreground">{(posts ?? []).length}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Events &amp; facility updates</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3D Architectural Digital Twin Showcase */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Residence 3D Digital Twin &amp; Available Inventory
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Explore architectural floor plates, inspect vacant units, or view private layouts in
                3D.
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="self-start sm:self-auto bg-slate-900 text-slate-300 border-slate-700"
          >
            Interactive Raycast View
          </Badge>
        </div>

        {/* 3D Model Centerpiece */}
        <BuildingDigitalTwin
          building={{
            id: lease?.propertyId || 'residence-tower',
            name: lease?.propertyName || 'Elite Residence Towers',
            floorCount: 8,
          }}
          onReserveUnit={(_unit: any) => navigate({ to: '/lease' })}
        />
      </div>

      {/* 2-Column Grid: Announcements & Service Requests */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* Community Announcements */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Community Announcements
              </CardTitle>
              <CardDescription className="text-xs">
                Official notices and event broadcasts from property management
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/community' })}
              className="text-xs font-semibold gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {postsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : !posts || posts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center italic">
                No community announcements posted yet.
              </p>
            ) : (
              posts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/60 hover:border-border transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{post.title}</p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.body}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Maintenance Service Requests */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Recent Service Requests
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of plumbing, electrical, and HVAC tickets
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/service-requests' })}
              className="text-xs font-semibold gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {requestsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : !requests || requests.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground italic">
                  No open service requests for your unit.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ to: '/service-requests' })}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submit New Request
                </Button>
              </div>
            ) : (
              requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-muted/40 border border-border/60 hover:border-border transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground capitalize">
                      {req.category || 'General Repair'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  >
                    {req.status?.replace('_', ' ') || 'Submitted'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

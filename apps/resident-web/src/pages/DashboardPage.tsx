import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
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
} from 'lucide-react';
import { useMyLease, useLeasePayments } from '@/hooks/use-leases';
import {
  useCommunityPosts,
  useMyServiceRequests,
  SERVICE_STATUS_STYLES,
  formatDate,
} from '@/hooks/use-resident-portal';

export default function ResidentDashboardPage() {
  const navigate = useNavigate();
  const { data: lease, isLoading: leaseLoading } = useMyLease();
  const { data: payments, isLoading: paymentsLoading } = useLeasePayments(lease?.id ?? '');
  const { data: posts, isLoading: postsLoading } = useCommunityPosts();
  const { data: requests, isLoading: requestsLoading } = useMyServiceRequests();

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

  const propertyDisplay = lease
    ? `${lease.propertyName ?? 'Residence'}${lease.unitLabel ? ` · Unit ${lease.unitLabel}` : ''}`
    : 'Resident Portal';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Home</h1>
        <p className="text-muted-foreground">{propertyDisplay}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rent Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {(nextPayment?.amount ?? lease?.monthlyRent ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {nextPayment?.dueDate
                    ? `Due ${new Date(nextPayment.dueDate).toLocaleDateString()}`
                    : 'Active account'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeRequests.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Active service tickets</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{(posts ?? []).length}</div>
                <p className="text-xs text-muted-foreground mt-1">Community updates</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lease Term</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {leaseLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{monthsRemaining} mo</div>
                <p className="text-xs text-muted-foreground mt-1">Remaining on lease</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {leaseLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-300">
                Next Payment Due
              </CardTitle>
              <DollarSign className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : nextPayment ? (
                <>
                  <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                    ${nextPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {nextPayment.period ?? 'Payment'} · Due{' '}
                    {nextPayment.dueDate ? new Date(nextPayment.dueDate).toLocaleDateString() : '—'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-rose-600 dark:text-rose-400">No upcoming payments</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Lease End Date
              </CardTitle>
              <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {leaseEnd ? leaseEnd.toLocaleDateString() : '—'}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1">
                <Home className="h-3 w-3" /> {monthsRemaining} months remaining
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Explore Ownership
              </CardTitle>
              <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                See what owning could cost you via Rent-To-Own &amp; Mortgage.
              </p>
              <Button size="sm" className="w-full" onClick={() => navigate({ to: '/lease' })}>
                <Calculator className="mr-2 h-4 w-4" /> Explore Scenarios
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Announcements</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/community' })}>
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {postsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !posts || posts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No community announcements posted yet.
              </p>
            ) : (
              posts.slice(0, 3).map((post) => (
                <div key={post.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{post.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Service Request Status</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/service-requests' })}>
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {requestsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !requests || requests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No service requests submitted yet.
              </p>
            ) : (
              requests.slice(0, 3).map((req) => {
                const statusMeta = SERVICE_STATUS_STYLES[req.status];
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {req.description.slice(0, 40)}
                        {req.description.length > 40 ? '...' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Submitted {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                  </div>
                );
              })
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: '/service-requests' })}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Submit New Request
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

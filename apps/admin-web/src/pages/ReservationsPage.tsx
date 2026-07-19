import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import { ListPager } from '@/components/ListPager';
import { Card, CardContent } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@elite-realty/shared-ui/components/ui';
import {
  ArrowLeft,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Key,
  Calendar,
  DollarSign,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  Star,
} from 'lucide-react';
import {
  useReservations,
  useCancelReservation,
  useConvertReservation,
  type Reservation,
  type ReservationStatus,
  type ReservationQuery,
} from '@/hooks/use-reservations';
import { formatCurrency } from '@/lib/agent-meta';

const STATUS_VARIANTS: Record<
  ReservationStatus,
  'success' | 'warning' | 'secondary' | 'destructive' | 'default'
> = {
  reserved: 'warning',
  converted: 'success',
  expired: 'destructive',
  cancelled: 'secondary',
};

export default function ReservationsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(15);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } =
    listQuery;
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');

  const fullQuery = useMemo(
    (): ReservationQuery => ({
      ...query,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [query, statusFilter],
  );

  const { data: result, isLoading, isError, refetch } = useReservations(fullQuery);
  const cancelReservation = useCancelReservation();
  const convertReservation = useConvertReservation();

  const reservations = result?.data ?? [];
  const meta = result?.meta;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const handleConvert = async (r: Reservation) => {
    // In a real app, you'd open a dialog to collect buyer/agent details
    // For now, we'll use a mock user as the performer
    const performedByUserId =
      localStorage.getItem('userId') || 'adb676df-5dc1-49f6-82e4-dc27ddbd30a6'; // admin
    const buyerUserId = 'abed9b84-5d45-48bd-b472-bc87c0167230'; // resident1
    const agentId = 'd66cbe6d-ca3c-4e5d-a17a-e707097ee6cc'; // agent1

    try {
      await convertReservation.mutateAsync({
        id: r.id,
        performedByUserId,
        buyerUserId,
        agentId,
        totalContractValue: r.unit?.listPrice ?? undefined,
        monthlyRentAmount:
          r.scheme?.schemeType === 'rent_to_own'
            ? r.optionFeeAmount
              ? r.optionFeeAmount / 12
              : 10000
            : undefined,
      });
    } catch (err) {
      console.error('Convert failed:', err);
      alert('Conversion failed. Check console for details.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground">Manage unit reservations and convert to sales</p>
        </div>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search reservations…"
        filters={
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as any);
              resetPage();
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={reservations.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Prospect
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Scheme
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Option Fee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Hold Expires
                    </th>
                    <th
                      {...sortHeader(
                        'status',
                        'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                      )}
                    >
                      Status{sortIndicator('status')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => {
                    const status = r.status as ReservationStatus;
                    const variant = STATUS_VARIANTS[status] ?? 'default';
                    const isReserved = status === 'reserved';
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{r.unit?.unitNumber ?? '—'}</span>
                          {r.unit?.buildingId && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({r.unit.buildingId.slice(0, 6)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{r.prospectName}</p>
                            {r.prospectContact && (
                              <p className="text-xs text-muted-foreground">{r.prospectContact}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">
                            {r.scheme?.code ?? r.schemeId.slice(0, 8)}
                          </span>
                          {r.scheme?.name && (
                            <span className="text-xs text-muted-foreground ml-1">
                              — {r.scheme.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.optionFeeAmount ? (
                            <span className="tabular-nums">
                              {formatCurrency(r.optionFeeAmount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {new Date(r.holdExpiry).toLocaleDateString()}
                            {new Date(r.holdExpiry) < new Date() && isReserved && (
                              <Badge variant="destructive" className="ml-1 text-[10px]">
                                Expired
                              </Badge>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={variant as any} className="text-xs">
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isReserved && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleConvert(r)}
                                disabled={convertReservation.isPending}
                              >
                                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                                Convert to Sale
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCancelTarget(r);
                                setCancelDialogOpen(true);
                              }}
                              disabled={cancelReservation.isPending || status !== 'reserved'}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <ListPager meta={meta} page={page} onPageChange={setPage} />
            </div>
          </GridState>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the reservation for{' '}
              <strong>{cancelTarget?.prospectName}</strong> on unit{' '}
              <strong>{cancelTarget?.unit?.unitNumber}</strong>? The unit will become available
              again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelTarget(null);
              }}
            >
              Keep Reservation
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!cancelTarget) return;
                await cancelReservation.mutateAsync(cancelTarget.id);
                setCancelDialogOpen(false);
                setCancelTarget(null);
              }}
              disabled={cancelReservation.isPending}
            >
              {cancelReservation.isPending ? 'Cancelling...' : 'Cancel Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

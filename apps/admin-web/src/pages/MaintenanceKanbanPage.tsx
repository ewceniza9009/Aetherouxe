import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
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
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Plus,
  Users,
  HardHat,
  Filter,
  DollarSign,
  FileCheck,
  Building2,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface ServiceRequestItem {
  id: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency' | string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | string;
  description: string;
  requestedAt?: string;
  createdAt: string;
  scheduledAt?: string;
  unit?: {
    unitNumber: string;
    property?: { name: string };
  };
  tenant?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  workOrders?: {
    id: string;
    status: string;
    estimatedCost?: number;
    actualCost?: number;
    vendor?: { name: string };
  }[];
}

interface ContractorItem {
  id: string;
  name: string;
  serviceType: string;
  phone?: string;
  email?: string;
}

export default function MaintenanceKanbanPage() {
  const queryClient = useQueryClient();
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ServiceRequestItem | null>(null);

  // Form states for dispatching vendor
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(3500);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  // Form states for completing ticket
  const [actualCost, setActualCost] = useState<number>(3500);
  const [completionNotes, setCompletionNotes] = useState('');

  // Fetch Service Requests
  const { data: requestsRes, isLoading } = useQuery({
    queryKey: ['maintenance-kanban-tickets'],
    queryFn: async () => {
      const res = await api.get('/service-requests?limit=100');
      return res.data;
    },
  });

  // Fetch Contractors
  const { data: contractorsRes } = useQuery({
    queryKey: ['contractors-list'],
    queryFn: async () => {
      const res = await api.get('/contractors?limit=50');
      return res.data;
    },
  });

  const tickets: ServiceRequestItem[] = requestsRes?.data ?? [];
  const contractors: ContractorItem[] = contractorsRes?.data ?? [];

  // Dispatch Vendor Mutation (Creates Work Order)
  const dispatchMutation = useMutation({
    mutationFn: async ({
      serviceRequestId,
      vendorId,
      estimatedCost,
      scheduledDate,
    }: {
      serviceRequestId: string;
      vendorId: string;
      estimatedCost: number;
      scheduledDate: string;
    }) => {
      const res = await api.post('/service-requests/work-orders', {
        serviceRequestId,
        vendorId,
        estimatedCost,
        scheduledDate,
        status: 'scheduled',
      });
      // Advance ticket to in_progress
      await api.patch(`/service-requests/${serviceRequestId}`, {
        status: 'in_progress',
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Contractor successfully dispatched!');
      setDispatchModalOpen(false);
      setActiveTicket(null);
      queryClient.invalidateQueries({ queryKey: ['maintenance-kanban-tickets'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch contractor');
    },
  });

  // Complete Ticket & Auto-Generate AP Invoice Mutation
  const completeMutation = useMutation({
    mutationFn: async ({
      ticket,
      actualCost,
      notes,
    }: {
      ticket: ServiceRequestItem;
      actualCost: number;
      notes: string;
    }) => {
      const workOrder = ticket.workOrders?.[0];
      if (workOrder) {
        // Complete the work order which triggers automated AP invoice
        await api.patch(`/service-requests/work-orders/${workOrder.id}`, {
          status: 'completed',
          actualCost,
          notes,
        });
      } else {
        // Complete service request directly
        await api.post(`/service-requests/${ticket.id}/complete`, { notes });
      }
    },
    onSuccess: () => {
      toast.success('Ticket marked completed! AP Invoice & GL journal line auto-generated.');
      setCompleteModalOpen(false);
      setActiveTicket(null);
      queryClient.invalidateQueries({ queryKey: ['maintenance-kanban-tickets'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to complete ticket');
    },
  });

  const filteredTickets = tickets.filter((t) => {
    if (selectedPriority === 'all') return true;
    return (t.priority || '').toLowerCase() === (selectedPriority || '').toLowerCase();
  });

  const columns = [
    {
      id: 'open',
      title: 'Open / Triage',
      badgeVariant: 'destructive' as const,
      tickets: filteredTickets.filter((t) => t.status === 'open'),
    },
    {
      id: 'scheduled',
      title: 'Vendor Dispatched',
      badgeVariant: 'warning' as const,
      tickets: filteredTickets.filter(
        (t) => t.status === 'in_progress' && t.workOrders && t.workOrders.length > 0,
      ),
    },
    {
      id: 'in_progress',
      title: 'In Execution',
      badgeVariant: 'default' as const,
      tickets: filteredTickets.filter(
        (t) => t.status === 'in_progress' && (!t.workOrders || t.workOrders.length === 0),
      ),
    },
    {
      id: 'completed',
      title: 'Resolved & AP Invoiced',
      badgeVariant: 'success' as const,
      tickets: filteredTickets.filter((t) => t.status === 'completed'),
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'emergency':
      case 'urgent':
        return (
          <Badge variant="destructive" className="text-[10px] uppercase">
            Emergency
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="warning" className="text-[10px] uppercase">
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="text-[10px] uppercase">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] uppercase">
            Low
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-0 animate-in fade-in-0 duration-200">
      {/* Standard Unified Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Maintenance Ticket Kanban
            </h1>
            <Badge variant="outline" className="text-xs">
              Live Dispatch
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time tenant work orders, contractor triage, and automated AP invoicing.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex bg-muted/60 border border-border p-1 rounded-lg">
            {['all', 'emergency', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${
                  selectedPriority === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-[calc(100vh-230px)]">
        {columns.map((col) => (
          <div
            key={col.id}
            className="rounded-xl border border-border bg-muted/30 p-3.5 flex flex-col h-full min-h-[calc(100vh-230px)]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3 shrink-0">
              <span className="font-semibold text-sm text-foreground">{col.title}</span>
              <Badge variant={col.badgeVariant} className="text-xs px-2 py-0">
                {col.tickets.length}
              </Badge>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-0.5">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-28 rounded-lg" />
                  <Skeleton className="h-28 rounded-lg" />
                </div>
              ) : col.tickets.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-xs text-muted-foreground italic border border-dashed border-border rounded-lg">
                  No tickets in this stage
                </div>
              ) : (
                col.tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="bg-card hover:bg-muted/30 border-border shadow-sm transition-all"
                  >
                    <CardContent className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded border border-border">
                            {ticket.category.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Location & Tenant Info */}
                      <div className="pt-2 border-t border-border text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>
                            {ticket.unit?.unitNumber
                              ? `Unit ${ticket.unit.unitNumber}`
                              : 'Common Facility'}
                          </span>
                        </div>
                        {ticket.tenant && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                            <Users className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                            <span>
                              {ticket.tenant.firstName} {ticket.tenant.lastName}
                            </span>
                          </div>
                        )}
                        {ticket.workOrders && ticket.workOrders[0] && (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded text-[11px] border border-amber-500/20 mt-1">
                            <HardHat className="w-3.5 h-3.5 shrink-0" />
                            <span>{ticket.workOrders[0].vendor?.name || 'Assigned Vendor'}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-1 flex items-center justify-end gap-2">
                        {ticket.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTicket(ticket);
                              setDispatchModalOpen(true);
                            }}
                            className="w-full text-xs gap-1.5 h-8"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Dispatch Contractor
                          </Button>
                        )}
                        {ticket.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTicket(ticket);
                              setActualCost(ticket.workOrders?.[0]?.estimatedCost || 3500);
                              setCompleteModalOpen(true);
                            }}
                            className="w-full text-xs gap-1.5 h-8"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            Complete &amp; Bill AP
                          </Button>
                        )}
                        {ticket.status === 'completed' && (
                          <div className="w-full text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            AP Invoiced &amp; Settled
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dispatch Vendor Modal */}
      {dispatchModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">Dispatch Contractor</h3>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">
                  Select Contractor
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose registered vendor --</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-medium">
                  Estimated Cost (₱)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-medium">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setDispatchModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!selectedVendorId || dispatchMutation.isPending}
                onClick={() =>
                  dispatchMutation.mutate({
                    serviceRequestId: activeTicket.id,
                    vendorId: selectedVendorId,
                    estimatedCost,
                    scheduledDate,
                  })
                }
              >
                {dispatchMutation.isPending ? 'Dispatching...' : 'Confirm Dispatch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Ticket & Generate AP Modal */}
      {completeModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground text-base">
                  Complete &amp; Generate AP Invoice
                </h3>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span>
                Marking this ticket completed will automatically generate a draft AP Invoice and
                General Ledger journal line.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">
                  Actual Final Cost (₱)
                </label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-medium">
                  Completion Notes &amp; Findings
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Replaced leaking P-trap and tested pressure..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setCompleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={completeMutation.isPending}
                onClick={() =>
                  completeMutation.mutate({
                    ticket: activeTicket,
                    actualCost,
                    notes: completionNotes,
                  })
                }
              >
                {completeMutation.isPending ? 'Generating AP...' : 'Finalize & Post AP'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

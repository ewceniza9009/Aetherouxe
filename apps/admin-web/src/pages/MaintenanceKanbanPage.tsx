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

  const tickets: ServiceRequestItem[] = requestsRes?.data || [];
  const contractors: ContractorItem[] = contractorsRes?.data || [
    { id: 'v-1', name: 'Apex Plumbing Solutions', serviceType: 'Plumbing' },
    { id: 'v-2', name: 'Voltaic Electrical & HVAC', serviceType: 'Electrical & AC' },
    { id: 'v-3', name: 'Prime Builders & Renovation', serviceType: 'Carpentry & Masonry' },
    { id: 'v-4', name: 'ShieldGuard Pest Control', serviceType: 'Pest Control' },
  ];

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
      color: 'border-rose-500/40 bg-rose-500/5',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      tickets: filteredTickets.filter((t) => t.status === 'open'),
    },
    {
      id: 'scheduled',
      title: 'Vendor Dispatched',
      color: 'border-amber-500/40 bg-amber-500/5',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      tickets: filteredTickets.filter(
        (t) => t.status === 'in_progress' && t.workOrders && t.workOrders.length > 0,
      ),
    },
    {
      id: 'in_progress',
      title: 'In Execution',
      color: 'border-sky-500/40 bg-sky-500/5',
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      tickets: filteredTickets.filter(
        (t) => t.status === 'in_progress' && (!t.workOrders || t.workOrders.length === 0),
      ),
    },
    {
      id: 'completed',
      title: 'Resolved & AP Invoiced',
      color: 'border-emerald-500/40 bg-emerald-500/5',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      tickets: filteredTickets.filter((t) => t.status === 'completed'),
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch ((priority || '').toLowerCase()) {
      case 'emergency':
      case 'urgent':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px] uppercase">
            Emergency
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] uppercase">
            High
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/40 text-[10px] uppercase">
            Medium
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/40 text-[10px] uppercase">
            Low
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Wrench className="w-7 h-7 text-amber-400" />
              Maintenance Ticket Kanban
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              Live Dispatch
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time tenant work orders, contractor quotation triage, and automated AP invoice
            generation.
          </p>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {['all', 'emergency', 'high', 'medium', 'low'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPriority(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  selectedPriority === p
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-2xl border ${col.color} p-4 flex flex-col min-h-[500px] backdrop-blur-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="font-bold text-sm text-white">{col.title}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badge}`}>
                {col.tickets.length}
              </span>
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {col.tickets.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-xs text-slate-500 italic">
                  No tickets in this stage
                </div>
              ) : (
                col.tickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className="bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md transition-all group"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getPriorityBadge(ticket.priority)}
                          <span className="text-[11px] font-semibold text-slate-400 capitalize bg-slate-800/80 px-2 py-0.5 rounded-md">
                            {ticket.category.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Location & Tenant Info */}
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-white font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {ticket.unit?.unitNumber
                              ? `Unit ${ticket.unit.unitNumber}`
                              : 'Common Area'}
                          </span>
                        </div>
                        {ticket.tenant && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>
                              {ticket.tenant.firstName} {ticket.tenant.lastName}
                            </span>
                          </div>
                        )}
                        {ticket.workOrders && ticket.workOrders[0] && (
                          <div className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-md mt-1">
                            <HardHat className="w-3.5 h-3.5 shrink-0" />
                            <span>{ticket.workOrders[0].vendor?.name || 'Assigned Vendor'}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 flex items-center justify-end gap-2">
                        {ticket.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveTicket(ticket);
                              setDispatchModalOpen(true);
                            }}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 h-8"
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
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 h-8"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            Complete &amp; Bill AP
                          </Button>
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Dispatch Contractor</h3>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Select Contractor</label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
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
                <label className="text-slate-400 block mb-1 font-semibold">
                  Estimated Cost (₱)
                </label>
                <input
                  type="number"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                {dispatchMutation.isPending ? 'Dispatching...' : 'Confirm Dispatch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Ticket & Generate AP Modal */}
      {completeModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Complete &amp; Generate AP Invoice
                </h3>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Marking this ticket completed will automatically generate a draft AP Invoice and
                General Ledger journal line.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Actual Final Cost (₱)
                </label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Completion Notes &amp; Findings
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Replaced leaking P-trap and tested pressure..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
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
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
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

import { useMemo, useState } from 'react';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import { useApInvoices, useApproveApInvoice, useDisburse, type ApInvoice } from '@/hooks/use-ap';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/agent-meta';
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ListPager } from '@/components/ListPager';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';

const statusConfig: Record<
  string,
  {
    label: string;
    variant: 'default' | 'outline' | 'destructive';
    icon: typeof Clock;
    className: string;
  }
> = {
  pending_approval: {
    label: 'Pending',
    variant: 'default',
    icon: Clock,
    className: 'bg-amber-500/20 text-amber-600 border-amber-500/50',
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    icon: CheckCircle2,
    className: 'bg-blue-500/20 text-blue-600 border-blue-500/50',
  },
  paid: {
    label: 'Paid',
    variant: 'outline',
    icon: CheckCircle2,
    className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/50',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-600 border-red-500/50',
  },
};

function sourceLink(invoice: ApInvoice): { href: string } | null {
  if (invoice.sourceType === 'SERVICE_REQUEST' && invoice.sourceId) {
    return { href: `/service-requests/${invoice.sourceId}` };
  }
  if (invoice.sourceType === 'COMMISSION') {
    return { href: '/finance/commission-aging' };
  }
  return null;
}

export default function DisbursementsPage() {
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, query, sortHeader, sortIndicator } = listQuery;
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryWithStatus = useMemo(
    () => ({ ...query, status: statusFilter !== 'all' ? statusFilter : undefined }),
    [query, statusFilter],
  );
  const { data, isLoading, isError } = useApInvoices(queryWithStatus);
  const approveMutation = useApproveApInvoice();
  const disburseMutation = useDisburse();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  const handleApprove = (id: string) => {
    setProcessingId(id);
    approveMutation.mutate(id, {
      onSuccess: () => {
        toast.success('AP invoice approved.');
        setProcessingId(null);
      },
      onError: () => {
        toast.error('Failed to approve invoice.');
        setProcessingId(null);
      },
    });
  };

  const handleDisburse = (id: string, amount: number) => {
    setProcessingId(id);
    disburseMutation.mutate(
      { id, amount },
      {
        onSuccess: () => {
          toast.success('Disbursement successful! Journal Entry created.');
          setProcessingId(null);
        },
        onError: () => {
          toast.error('Failed to process disbursement.');
          setProcessingId(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6 flex flex-col ">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Accounts Payable</h2>
        <p className="text-muted-foreground mt-2">Review, approve, and disburse vendor payments.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <GridToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search invoices..."
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_approval">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={invoices.length === 0}
            onRetry={() => {}}
          >
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Invoice #</TableHead>
                  <TableHead {...sortHeader('sourceType', 'text-muted-foreground')}>
                    Source{sortIndicator('sourceType')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">Vendor</TableHead>
                  <TableHead {...sortHeader('amount', 'text-muted-foreground')}>
                    Amount{sortIndicator('amount')}
                  </TableHead>
                  <TableHead {...sortHeader('status', 'text-muted-foreground')}>
                    Status{sortIndicator('status')}
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: ApInvoice) => {
                  const cfg = statusConfig[invoice.status] ?? statusConfig.pending_approval;
                  const StatusIcon = cfg.icon;
                  const isProcessing = processingId === invoice.id;
                  const totalDisbursed = (invoice.disbursements ?? []).reduce(
                    (sum, d) => sum + d.amount,
                    0,
                  );
                  const remaining = invoice.amount - totalDisbursed;

                  return (
                    <TableRow
                      key={invoice.id}
                      className="border-border hover:bg-card/5 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-foreground">
                        {(() => {
                          const link = sourceLink(invoice);
                          const label = invoice.invoiceNumber ?? '—';
                          return link && label !== '—' ? (
                            <a
                              href={link.href}
                              className="text-primary underline-offset-4 hover:underline font-semibold"
                            >
                              {label}
                            </a>
                          ) : (
                            <span>{label}</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <Badge variant="outline" className="border-border text-foreground/80">
                          {invoice.sourceType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.vendor?.companyName ?? '—'}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant} className={cfg.className}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'pending_approval' && (
                            <Button
                              variant="default"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleApprove(invoice.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </Button>
                          )}
                          {invoice.status === 'approved' && remaining > 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleDisburse(invoice.id, remaining)}
                              className="bg-gold hover:bg-gold/90 text-black font-semibold"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Disburse'
                              )}
                            </Button>
                          )}
                          {invoice.status === 'paid' && (
                            <Badge
                              variant="outline"
                              className="text-emerald-600 border-emerald-500/50"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Complete
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <ListPager meta={meta} page={page} onPageChange={setPage} itemLabel="invoices" />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

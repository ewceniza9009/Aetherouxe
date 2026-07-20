import { useMemo, useState } from 'react';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import { useApInvoices, useDisburse, type ApInvoice } from '@/hooks/use-ap';
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
import { formatCurrency } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ListPager } from '@/components/ListPager';
import { Card, CardContent } from '@/components/ui/card';

export default function DisbursementsPage() {
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, query, sortHeader, sortIndicator } = listQuery;
  const { data, isLoading, isError } = useApInvoices(query);
  const disburseMutation = useDisburse();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const invoices = data?.data ?? [];
  const meta = data?.meta;

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
        <p className="text-muted-foreground mt-2">
          Manage and disburse funds for approved AP invoices.
        </p>
      </div>

      <GridToolbar search={search} onSearchChange={setSearch} placeholder="Search invoices..." />

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
                  <TableHead {...sortHeader('sourceType', 'text-muted-foreground')}>
                    Source{sortIndicator('sourceType')}
                  </TableHead>
                  <TableHead className="text-muted-foreground">Notes</TableHead>
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
                {invoices.map((invoice: ApInvoice) => (
                  <TableRow
                    key={invoice.id}
                    className="border-border hover:bg-card/5 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">
                      <Badge variant="outline" className="border-border text-foreground/80">
                        {invoice.sourceType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{invoice.notes}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      {invoice.status === 'paid' ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={invoice.status === 'paid' ? 'outline' : 'default'}
                        size="sm"
                        disabled={invoice.status === 'paid' || processingId === invoice.id}
                        onClick={() => handleDisburse(invoice.id, invoice.amount)}
                        className={
                          invoice.status !== 'paid'
                            ? 'bg-gold hover:bg-gold/90 text-black font-semibold'
                            : 'border-border text-muted-foreground'
                        }
                      >
                        {processingId === invoice.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : invoice.status === 'paid' ? (
                          'Disbursed'
                        ) : (
                          'Disburse Funds'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ListPager meta={meta} page={page} onPageChange={setPage} itemLabel="invoices" />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

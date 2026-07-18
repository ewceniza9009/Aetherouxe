import { useState } from 'react';
import { useApInvoices, useDisburse } from '@/hooks/use-ap';
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

export default function DisbursementsPage() {
  const { data: invoices, isLoading } = useApInvoices();
  const disburseMutation = useDisburse();
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Accounts Payable</h2>
        <p className="text-muted-foreground mt-2">
          Manage and disburse funds for approved AP invoices.
        </p>
      </div>

      <div className="rounded-md border border-white/10 bg-black/40 backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Source</TableHead>
              <TableHead className="text-white/60">Notes</TableHead>
              <TableHead className="text-white/60">Amount</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-right text-white/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/40" />
                </TableCell>
              </TableRow>
            ) : !invoices?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-white/40">
                  No pending invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice: any) => (
                <TableRow key={invoice.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-white">
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {invoice.sourceType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/70">{invoice.notes}</TableCell>
                  <TableCell className="font-semibold text-white">
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
                      className={invoice.status !== 'paid' ? 'bg-gold hover:bg-gold/90 text-black font-semibold' : 'border-white/20 text-white/50'}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

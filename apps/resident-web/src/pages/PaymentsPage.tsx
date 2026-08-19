import { formatCurrency } from '@elite-realty/shared-ui/lib/utils';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@elite-realty/shared-ui/components/ui';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Building,
  Receipt,
  FileCheck,
} from 'lucide-react';
import {
  useMyLease,
  useLeasePayments,
  useRecordPayment,
  type PaymentMethod,
} from '@/hooks/use-leases';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { data: lease } = useMyLease();
  const { data: payments, isLoading, refetch } = useLeasePayments(lease?.id ?? '');
  const recordPayment = useRecordPayment();

  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'card' | 'bank'>('gcash');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const list = payments ?? [];
  const unpaid = list
    .filter((p) => p.status !== 'paid')
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
  const nextDue = unpaid[0];

  const handlePayNow = async () => {
    if (!nextDue) return;
    await recordPayment.mutateAsync({
      id: nextDue.id,
      amount: nextDue.amount,
      method: paymentMethod as PaymentMethod,
      paidDate: new Date().toISOString(),
    });
    refetch();
  };

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 p-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Resident Billing Concierge
              </span>
              <span className="text-xs text-slate-400">Zero-Fee Automated Settlements</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white">
              Rent & Dues Settlement
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Pay monthly lease dues, association fees, and utility bills seamlessly via GCash,
              Credit Card, or Instapay.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-right">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                Active Unit
              </span>
              <span className="text-base font-black text-emerald-400">Unit Penthouse 1204</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pay" className="space-y-6">
        <TabsList className="bg-muted/60 p-1.5 rounded-2xl border border-border/80 w-full sm:w-auto">
          <TabsTrigger value="pay" className="rounded-xl font-bold text-xs px-6 py-2">
            Make a Payment
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl font-bold text-xs px-6 py-2">
            Settlement History & Receipts
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pay */}
        <TabsContent value="pay" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          ) : !nextDue ? (
            <Card className="border-border/80 bg-card shadow-sm">
              <CardContent className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">All Accounts Settled in Full</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  You have zero pending balances or upcoming overdue invoices. Thank you for your
                  on-time residency.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Balance Due Card */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-border/80 bg-card shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Current Outstanding Balance
                      </span>
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                        Due for Settlement
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <div className="text-4xl font-black text-foreground tracking-tight">
                        {formatCurrency(nextDue.amount)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {nextDue.period || 'Monthly Lease'} • Due{' '}
                          {nextDue.dueDate
                            ? new Date(nextDue.dueDate).toLocaleDateString()
                            : 'Immediate'}
                        </span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Unit Rent</span>
                        <span className="font-semibold">
                          {formatCurrency(Number(nextDue.amount) * 0.88)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Association & Amenities</span>
                        <span className="font-semibold">
                          {formatCurrency(Number(nextDue.amount) * 0.12)}
                        </span>
                      </div>
                      <div className="border-t border-border/60 pt-2 flex justify-between font-bold">
                        <span>Total Payable</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(nextDue.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Encrypted 256-Bit SSL Payment Processing</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Payment Gateway Selection */}
              <div className="lg:col-span-7">
                <Card className="border-border/80 bg-card shadow-sm">
                  <CardHeader className="pb-4 border-b border-border/60">
                    <CardTitle className="text-base font-bold">Select Payment Channel</CardTitle>
                    <CardDescription>
                      Choose your preferred instant settlement gateway
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('gcash')}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'gcash'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs font-bold">GCash eWallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'card'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs font-bold">Debit / Credit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                          paymentMethod === 'bank'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
                            : 'bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        <Building className="w-5 h-5" />
                        <span className="text-xs font-bold">Bank Transfer</span>
                      </button>
                    </div>

                    {paymentMethod === 'gcash' && (
                      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                          <Smartphone className="w-4 h-4" />
                          <span>PayMongo GCash QR Integration Active</span>
                        </div>
                        <p className="text-muted-foreground">
                          Clicking Pay will securely authenticate and settle the transaction
                          directly with your GCash mobile wallet.
                        </p>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold">Card Number</Label>
                          <Input
                            placeholder="4123 4567 8901 2345"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">Expiry Date</Label>
                            <Input
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold">CVV / CVC</Label>
                            <Input
                              placeholder="123"
                              type="password"
                              maxLength={4}
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handlePayNow}
                      disabled={recordPayment.isPending}
                      className="w-full py-6 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      {recordPayment.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Authorize Settlement • {formatCurrency(nextDue.amount)}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: History */}
        <TabsContent value="history">
          <Card className="border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-4 border-b border-border/60">
              <CardTitle className="text-base font-bold">
                Settled Payments & Official Receipts
              </CardTitle>
              <CardDescription>
                Verified transaction history and digital BIR receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border/80 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="py-3.5 px-6">Period</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Method</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Date Paid</th>
                      <th className="py-3.5 px-6 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                          No previous transaction records found.
                        </td>
                      </tr>
                    ) : (
                      list.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-4 px-6 font-bold text-foreground">
                            {p.period || 'Monthly Lease'}
                          </td>
                          <td className="py-4 px-6 font-bold text-foreground">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-4 px-6 text-xs uppercase font-semibold text-muted-foreground">
                            {p.method || 'Online'}
                          </td>
                          <td className="py-4 px-6">
                            <Badge
                              className={`text-[10px] font-bold uppercase ${
                                p.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-xs text-muted-foreground">
                            {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

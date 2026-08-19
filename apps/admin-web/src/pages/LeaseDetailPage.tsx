import { EmptyState } from '@/components/ui/empty-state';
import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { formatCurrency } from '@/lib/agent-meta';
import * as Tabs from '@radix-ui/react-tabs';
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
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
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
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@elite-realty/shared-ui/components/ui';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  Home,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  User,
  CreditCard,
  Building2,
  Percent,
} from 'lucide-react';
import {
  useLease,
  useLeasePayments,
  useRecordPayment,
  useTerminateLease,
  type LeaseStatus,
  type PaymentMethod,
  type RentalPayment,
} from '@/hooks/use-leases';
import {
  useMortgageScenarios,
  useGenerateScenario,
  type GenerateScenarioInput,
} from '@/hooks/use-mortgage';

const statusVariant: Record<
  LeaseStatus,
  'success' | 'warning' | 'destructive' | 'default' | 'secondary'
> = {
  active: 'success',
  rto_active: 'success',
  pending: 'warning',
  expiring: 'warning',
  rto_delinquent: 'warning',
  expired: 'secondary',
  rto_converted: 'secondary',
  terminated: 'destructive',
};

const statusLabel: Record<LeaseStatus, string> = {
  active: 'Active',
  rto_active: 'RTO Active',
  pending: 'Pending',
  expiring: 'Expiring',
  rto_delinquent: 'RTO Delinquent',
  expired: 'Expired',
  rto_converted: 'RTO Converted',
  terminated: 'Terminated',
};

export default function LeaseDetailPage() {
  const { id } = useParams({ from: '/protected/leases/$id' });
  const navigate = useNavigate();
  const { data: lease, isLoading, error } = useLease(id);
  const {
    data: payments,
    isLoading: loadingPayments,
    refetch: refetchPayments,
  } = useLeasePayments(id);
  const {
    data: scenariosData,
    isLoading: loadingScenarios,
    refetch: refetchScenarios,
  } = useMortgageScenarios({ leaseAgreementId: id });

  const recordPayment = useRecordPayment();
  const terminateLease = useTerminateLease();
  const generateScenario = useGenerateScenario();

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<RentalPayment | null>(null);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>('card');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));

  const [generateOpen, setGenerateOpen] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState('20');
  const [interestRate, setInterestRate] = useState('6.5');
  const [termMonths, setTermMonths] = useState('360');

  if (error) {
    return (
      <div className="space-y-6 flex flex-col">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: '/leases' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold text-foreground">Failed to load lease agreement</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !lease) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const openRecord = (payment: RentalPayment) => {
    setRecordTarget(payment);
    setRecordAmount(String(payment.amount));
    setRecordMethod(payment.method ?? 'card');
    setRecordDate(new Date().toISOString().slice(0, 10));
    setRecordOpen(true);
  };

  const submitRecord = async () => {
    if (!recordTarget) return;
    await recordPayment.mutateAsync({
      id: recordTarget.id,
      amount: parseFloat(recordAmount),
      method: recordMethod,
      paidDate: recordDate,
    });
    setRecordOpen(false);
    refetchPayments();
  };

  const submitGenerate = async () => {
    const payload: GenerateScenarioInput = {
      leaseAgreementId: id,
      downPaymentPercent: parseFloat(downPaymentPercent),
      interestRate: parseFloat(interestRate),
      termMonths: parseInt(termMonths, 10),
    };
    await generateScenario.mutateAsync(payload);
    setGenerateOpen(false);
    refetchScenarios();
  };

  const overdue = (payments ?? []).filter(
    (p) => p.status === 'pending' && p.dueDate && new Date(p.dueDate) < new Date(),
  );
  const paidCount = (payments ?? []).filter((p) => p.status === 'paid').length;
  const totalPayments = (payments ?? []).length;
  const reliabilityRate = totalPayments > 0 ? Math.round((paidCount / totalPayments) * 100) : 100;

  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const totalDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const elapsedDays = Math.max(
    0,
    Math.min(totalDays, Math.round((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))),
  );
  const progressPct = Math.round((elapsedDays / totalDays) * 100);

  return (
    <div className="space-y-6 flex flex-col animate-in fade-in-0 duration-200">
      {/* Top Header Standard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: '/leases' })}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {lease.tenantName}
              </h1>
              <Badge variant={statusVariant[lease.status]}>{statusLabel[lease.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>{lease.propertyName || 'Unassigned Property'}</span>
              {lease.unitLabel && (
                <span className="font-semibold text-foreground">/ Unit {lease.unitLabel}</span>
              )}
              <span>• {lease.tenantEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: `/leases/${id}/edit` })}
            className="gap-1.5"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Terms</span>
          </Button>
          {lease.status !== 'terminated' && lease.status !== 'expired' && (
            <Button
              variant="destructive"
              size="sm"
              disabled={terminateLease.isPending}
              onClick={async () => {
                if (confirm('Are you sure you want to terminate this lease agreement?')) {
                  await terminateLease.mutateAsync({ id });
                  navigate({ to: '/leases' });
                }
              }}
            >
              Terminate
            </Button>
          )}
        </div>
      </div>

      {/* 4 Unified KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Rent
            </CardTitle>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(Number(lease.monthlyRent))}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {lease.leaseType.replace(/_/g, ' ')} Term
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Security Deposit
            </CardTitle>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {lease.securityDeposit != null ? formatCurrency(Number(lease.securityDeposit)) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">Held in escrow account</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lease Duration
            </CardTitle>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{progressPct}%</span>
              <span className="text-xs text-muted-foreground">
                {Math.max(0, totalDays - elapsedDays)} days left
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment Reliability
            </CardTitle>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">{reliabilityRate}%</div>
            <p className="text-xs text-muted-foreground">
              {paidCount} of {totalPayments || 1} payments settled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs.Root defaultValue="overview" className="space-y-4">
        <Tabs.List className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1">
          <Tabs.Trigger
            value="overview"
            className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Agreement Details
          </Tabs.Trigger>
          <Tabs.Trigger
            value="payments"
            className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-1.5"
          >
            <span>Payment Schedule</span>
            {overdue.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                {overdue.length} overdue
              </Badge>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mortgage"
            className="rounded-md px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Mortgage Options
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab 1: Agreement Details */}
        <Tabs.Content value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Legal & Financial Terms */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Contract &amp; Financial Terms
                </CardTitle>
                <CardDescription>Legal agreement parameters and late penalties</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                    <span className="text-muted-foreground font-medium block mb-0.5">
                      Start Date
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(lease.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                    <span className="text-muted-foreground font-medium block mb-0.5">End Date</span>
                    <p className="text-sm font-bold text-foreground">
                      {new Date(lease.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Late Payment Penalty</span>
                    <span className="font-semibold text-foreground">
                      {lease.penaltyPercent != null ? `${lease.penaltyPercent}%` : '3%'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Grace Period</span>
                    <span className="font-semibold text-foreground">
                      {lease.graceDays != null ? `${lease.graceDays} Days` : '5 Days'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lease Type</span>
                    <span className="font-semibold text-foreground capitalize">
                      {lease.leaseType.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tenant & Property Info */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Tenant &amp; Location Profile
                </CardTitle>
                <CardDescription>Resident contact information and unit assignment</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tenant Name</span>
                    <span className="font-semibold text-foreground">{lease.tenantName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tenant Email</span>
                    <span className="font-semibold text-foreground">{lease.tenantEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assigned Property</span>
                    <span className="font-semibold text-foreground">
                      {lease.propertyName || 'Unassigned'}
                    </span>
                  </div>
                  {lease.unitLabel && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Assigned Unit</span>
                      <span className="font-bold text-primary">Unit {lease.unitLabel}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs text-foreground font-medium">
                    Verified Digital Tenancy Record (BIR &amp; Legal Compliance Checked)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        {/* Tab 2: Payment Schedule */}
        <Tabs.Content value="payments" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Payment Schedule &amp; Receipts
                  </CardTitle>
                  <CardDescription>All rental payment obligations and history</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchPayments()}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPayments ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (payments ?? []).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No payment schedule records found for this lease.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs font-semibold text-muted-foreground bg-muted/40 uppercase">
                      <tr>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Paid Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(payments ?? []).map((p) => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-xs font-medium text-foreground">
                            {p.period ?? 'Monthly Dues'}
                          </td>
                          <td className="py-3 px-4 text-xs text-right font-bold text-foreground">
                            {formatCurrency(Number(p.amount))}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground capitalize">
                            {p.method?.replace(/_/g, ' ') || 'Online'}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                p.status === 'paid'
                                  ? 'success'
                                  : p.status === 'pending'
                                    ? 'warning'
                                    : 'destructive'
                              }
                              className="text-[10px]"
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.status !== 'paid' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRecord(p)}
                                className="h-7 text-xs"
                              >
                                Record Payment
                              </Button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* Tab 3: Mortgage Scenario Modeling */}
        <Tabs.Content value="mortgage" className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Mortgage &amp; Financing Scenarios
                  </CardTitle>
                  <CardDescription>Simulate bank amortizations for property buyout</CardDescription>
                </div>
                <Button size="sm" onClick={() => setGenerateOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Generate Simulation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {loadingScenarios ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (scenariosData?.data ?? []).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No mortgage scenarios created yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(scenariosData?.data ?? []).map((sc: any) => (
                    <div
                      key={sc.id}
                      className="p-4 rounded-lg bg-muted/40 border border-border space-y-2.5"
                    >
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="font-semibold text-foreground text-sm">
                          {sc.termMonths / 12}-Year Term
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {sc.interestRate}% APR
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Down Payment ({sc.downPaymentPercent}%)
                          </span>
                          <span className="font-medium">
                            {formatCurrency(Number(sc.downPaymentAmount))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal Loan</span>
                          <span className="font-medium">
                            {formatCurrency(Number(sc.loanAmount))}
                          </span>
                        </div>
                        <div className="border-t border-border pt-1.5 flex justify-between font-bold">
                          <span>Monthly Due</span>
                          <span className="text-primary">
                            {formatCurrency(Number(sc.monthlyAmortization))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      {/* Record Payment Modal */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Rental Payment</DialogTitle>
            <DialogDescription>Mark payment as paid and update the tenant ledger</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Amount (PHP)</Label>
              <Input
                type="number"
                value={recordAmount}
                onChange={(e) => setRecordAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Payment Method</Label>
              <Select
                value={recordMethod}
                onValueChange={(v) => setRecordMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gcash">GCash eWallet</SelectItem>
                  <SelectItem value="card">Credit / Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer / ACH</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Settlement Date</Label>
              <Input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRecord} disabled={recordPayment.isPending}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Simulation Modal */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Mortgage Simulation</DialogTitle>
            <DialogDescription>Configure financing parameters for this tenant</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Down Payment (%)</Label>
              <Input
                type="number"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Interest Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Loan Term</Label>
              <Select value={termMonths} onValueChange={(v) => setTermMonths(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="120">10 Years</SelectItem>
                  <SelectItem value="180">15 Years</SelectItem>
                  <SelectItem value="240">20 Years</SelectItem>
                  <SelectItem value="360">30 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitGenerate} disabled={generateScenario.isPending}>
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

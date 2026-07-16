import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/agent-meta";
import * as Tabs from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  Home,
  Calculator,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { LeaseType } from "@elite-realty/shared-types";
import {
  useLease,
  useLeasePayments,
  useRecordPayment,
  useTerminateLease,
  type LeaseStatus,
  type PaymentMethod,
  type RentalPayment,
} from "@/hooks/use-leases";
import {
  useMortgageScenarios,
  useGenerateScenario,
  type MortgageScenario,
  type GenerateScenarioInput,
} from "@/hooks/use-mortgage";

const statusVariant: Record<LeaseStatus, "success" | "warning" | "destructive" | "default" | "secondary"> = {
  active: "success",
  rto_active: "success",
  pending: "warning",
  expiring: "warning",
  rto_delinquent: "warning",
  expired: "secondary",
  rto_converted: "secondary",
  terminated: "destructive",
};

const statusLabel: Record<LeaseStatus, string> = {
  active: "Active",
  rto_active: "RTO Active",
  pending: "Pending",
  expiring: "Expiring",
  rto_delinquent: "RTO Delinquent",
  expired: "Expired",
  rto_converted: "RTO Converted",
  terminated: "Terminated",
};

const paymentStatusVariant: Record<RentalPayment["status"], "success" | "warning" | "destructive" | "secondary"> = {
  paid: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "secondary",
};

export default function LeaseDetailPage() {
  const { id } = useParams({ from: "/protected/leases/$id" });
  const navigate = useNavigate();
  const { data: lease, isLoading, error } = useLease(id);
  const { data: payments, isLoading: loadingPayments, refetch: refetchPayments } = useLeasePayments(id);
  const { data: scenariosData, isLoading: loadingScenarios, refetch: refetchScenarios } =
    useMortgageScenarios({ leaseAgreementId: id });

  const recordPayment = useRecordPayment();
  const terminateLease = useTerminateLease();
  const generateScenario = useGenerateScenario();

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordTarget, setRecordTarget] = useState<RentalPayment | null>(null);
  const [recordAmount, setRecordAmount] = useState("");
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>("card");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));

  const [generateOpen, setGenerateOpen] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState("20");
  const [interestRate, setInterestRate] = useState("6.5");
  const [termMonths, setTermMonths] = useState("360");

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/leases" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load lease</p>
            <p className="text-sm text-muted-foreground">Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !lease) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const openRecord = (payment: RentalPayment) => {
    setRecordTarget(payment);
    setRecordAmount(String(payment.amount));
    setRecordMethod(payment.method ?? "card");
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

  const overdue = (payments ?? []).filter((p) => p.status === "pending" && p.dueDate && new Date(p.dueDate) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/leases" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: `/leases/${id}/edit` })}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          {lease.status !== "terminated" && lease.status !== "expired" && (
            <Button
              variant="destructive"
              disabled={terminateLease.isPending}
              onClick={async () => {
                if (confirm("Are you sure you want to terminate this lease?")) {
                  await terminateLease.mutateAsync({ id });
                  navigate({ to: "/leases" });
                }
              }}
            >
              Terminate
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{lease.tenantName}</h1>
                <Badge variant={statusVariant[lease.status]}>{statusLabel[lease.status]}</Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Home className="h-4 w-4" /> {lease.propertyName ?? "Unassigned property"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm md:text-right">
              <div>
                <p className="text-muted-foreground flex items-center gap-1 md:justify-end">
                  <Calendar className="h-4 w-4" /> Start
                </p>
                <p className="font-medium">{new Date(lease.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1 md:justify-end">
                  <Calendar className="h-4 w-4" /> End
                </p>
                <p className="font-medium">{new Date(lease.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <Badge variant="outline" className="mt-1">
                  {lease.leaseType.replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1 md:justify-end">
                  <DollarSign className="h-4 w-4" /> Monthly Rent
                </p>
                <p className="text-lg font-bold">
                  {formatCurrency(Number(lease.monthlyRent))}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs.Root defaultValue="overview">
        <Tabs.List className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted p-1">
          <Tabs.Trigger
            value="overview"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger
            value="payments"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Payments {overdue.length > 0 && <Badge variant="destructive" className="ml-2">{overdue.length} overdue</Badge>}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="mortgage"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Mortgage Options
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lease Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Detail label="Tenant Email" value={lease.tenantEmail} />
              <Detail label="Lease Type" value={lease.leaseType.replace(/_/g, " ")} />
              <Detail label="Status" value={statusLabel[lease.status]} />
              <Detail label="Start Date" value={new Date(lease.startDate).toLocaleDateString()} />
              <Detail label="End Date" value={new Date(lease.endDate).toLocaleDateString()} />
              <Detail
                label="Monthly Rent"
                value={formatCurrency(lease.monthlyRent)}
              />
              <Detail
                label="Security Deposit"
                value={lease.securityDeposit != null ? formatCurrency(lease.securityDeposit) : "—"}
              />
              <Detail label="Penalty %" value={lease.penaltyPercent != null ? `${lease.penaltyPercent}%` : "—"} />
              <Detail label="Grace Days" value={lease.graceDays != null ? String(lease.graceDays) : "—"} />
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rental Payments</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchPayments()}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (payments ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No payments recorded yet.</p>
              ) : (
                <div className="rounded-md border scroll-grid">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Paid Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payments ?? []).map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{p.period ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(Number(p.amount))}
                          </td>
                          <td className="px-4 py-3 text-sm">{p.method.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-sm">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 text-sm">{p.paidDate ? new Date(p.paidDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={paymentStatusVariant[p.status]}>{p.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {p.status !== "paid" && (
                              <Button variant="ghost" size="sm" onClick={() => openRecord(p)}>
                                Record Payment
                              </Button>
                            )}
                            {p.status === "paid" && (
                              <span className="flex items-center gap-1 text-green-600 text-xs">
                                <CheckCircle2 className="h-3 w-3" /> Paid
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

        <Tabs.Content value="mortgage" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" /> Mortgage Scenarios
                  </CardTitle>
                  <CardDescription>Estimate purchase financing for this tenant</CardDescription>
                </div>
                <Button size="sm" onClick={() => setGenerateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Generate New Scenario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingScenarios ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (scenariosData?.data ?? []).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No scenarios generated yet.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setGenerateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Generate First Scenario
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(scenariosData?.data ?? []).map((sc: MortgageScenario) => (
                    <div
                      key={sc.id}
                      className="flex flex-col gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
                      onClick={() => navigate({ to: `/leases/${id}/mortgage/${sc.id}` })}
                    >
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Calculator className="h-4 w-4 text-muted-foreground" />
                          {sc.termMonths / 12} yr · {sc.downPaymentPercent}% down · {sc.interestRate}% APR
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Loan {formatCurrency(Number(sc.loanAmount))} · Monthly {formatCurrency(Number(sc.monthlyPayment))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total Interest</p>
                          <p className="font-semibold text-yellow-700">{formatCurrency(Number(sc.totalInterest))}</p>
                        </div>
                        <Button variant="outline" size="sm">View Schedule</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {recordTarget?.period ? `Period: ${recordTarget.period}` : "Record a payment for this lease"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={recordAmount}
                onChange={(e) => setRecordAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={recordMethod} onValueChange={(v) => setRecordMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidDate">Paid Date</Label>
              <Input id="paidDate" type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>Cancel</Button>
            <Button
              onClick={submitRecord}
              disabled={recordPayment.isPending || !recordAmount || parseFloat(recordAmount) <= 0}
            >
              {recordPayment.isPending ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Mortgage Scenario</DialogTitle>
            <DialogDescription>Configure loan assumptions to estimate financing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dp">Down Payment (%)</Label>
              <Input
                id="dp"
                type="number"
                step="0.1"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Interest Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term (months)</Label>
              <Select value={termMonths} onValueChange={setTermMonths}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="180">15 years (180)</SelectItem>
                  <SelectItem value="240">20 years (240)</SelectItem>
                  <SelectItem value="360">30 years (360)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
            <Button onClick={submitGenerate} disabled={generateScenario.isPending}>
              {generateScenario.isPending ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}


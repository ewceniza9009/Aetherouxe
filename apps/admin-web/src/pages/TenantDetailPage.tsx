import { EmptyState } from "@/components/ui/empty-state";
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { formatCurrency } from "@/lib/agent-meta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Home,
  Building2,
  KeyRound,
  Calculator,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/hooks/use-users";
import { useTenantLeases, type TenantLease } from "@/hooks/use-leases";
import { useMortgageScenario } from "@/hooks/use-mortgage";
import { useRtoContract, useRtoLedger } from "@/hooks/use-rto";

const leaseTypeLabel: Record<string, string> = {
  standard_rental: "Standard Rental",
  rent_to_own: "Rent-to-Own",
  corporate_lease: "Corporate Lease",
  short_term: "Short-term",
};

/* ── Group leases by unit, keep only the most recent per unit ── */
function groupByUnit(leases: TenantLease[]) {
  const map = new Map<string, TenantLease>();
  for (const l of leases) {
    const key = l.unitId ?? `${l.property?.id ?? ""}::${l.unitLabel ?? ""}`;
    const existing = map.get(key);
    if (!existing || new Date(l.createdAt) > new Date(existing.createdAt)) {
      map.set(key, l);
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
}

export default function TenantDetailPage() {
  const { id } = useParams({ from: "/protected/tenants/$id" });
  const navigate = useNavigate();
  const { data: user, isLoading: loadingUser } = useUser(id);
  const { data: leases, isLoading: loadingLeases } = useTenantLeases(id);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const units = useMemo(() => (leases ? groupByUnit(leases) : []), [leases]);
  const active = units.find((u) => u.id === selectedUnit) ?? units[0] ?? null;

  const initials =
    user && [user.firstName, user.lastName].filter(Boolean).join(" ")
      ? [user.firstName, user.lastName].filter(Boolean).join(" ").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : user?.email?.slice(0, 2).toUpperCase() ?? "—";

  const isLoading = loadingUser || loadingLeases;

  return (
    <div className="space-y-6 flex flex-col ">
      {/* Back */}
      <Button variant="outline" size="icon" onClick={() => navigate({ to: "/tenants" })}>
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Tenant header */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <AvatarUpload 
            userId={user?.id ?? ""}
            avatarUrl={user?.avatarUrl}
            initials={initials}
            className="h-14 w-14"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "Tenant"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {user?.email && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
              )}
              {user?.phone && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {user.phone}</span>
              )}
              <Badge variant="outline">{units.length} unit{units.length !== 1 ? "s" : ""}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : units.length === 0 ? (
        <EmptyState title="No units yet" description="This tenant has no leases or units assigned." />
      ) : (
        <div className="unit-detail-grid grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* ── Left: Unit list ── */}
          <div className="space-y-2">
            {units.map((u) => {
              const isSelected = active?.id === u.id;
              const propertyCode = u.property?.propertyCode ?? "—";
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUnit(u.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isSelected ? "bg-primary/20" : "bg-muted"
                      }`}>
                        <KeyRound className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold">Unit {u.unitLabel ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{propertyCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.isActive ? "success" : "secondary"}>
                        {u.isActive ? "Active" : "Closed"}
                      </Badge>
                      <ChevronRight className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{leaseTypeLabel[u.leaseType] ?? u.leaseType}</span>
                    <span>{formatCurrency(u.monthlyRentAmount)}/mo</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Right: Detail tabs ── */}
          {active && (
            <div className="min-w-0">
              <UnitDetail lease={active} navigate={navigate} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Unit detail with tabs ── */
function UnitDetail({
  lease,
  navigate,
}: {
  lease: TenantLease;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const mortgage = lease.mortgageScenarios?.[0];
  const rto = lease.rtoContract;
  const propertyCode = lease.property?.propertyCode ?? "—";
  const propertyType = lease.property?.propertyType?.replace(/_/g, " ") ?? "";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary">
              Overview
            </TabsTrigger>
            <TabsTrigger value="financing" className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary">
              Financing
            </TabsTrigger>
          </TabsList>

          {/* ── Overview tab ── */}
          <TabsContent value="overview" className="p-6">
            <div className="space-y-6">
              {/* Property & Unit */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Property</p>
                    <button
                      className="font-semibold text-left hover:text-primary"
                      onClick={() => lease.property?.id && navigate({ to: `/properties/${lease.property.id}` })}
                    >
                      {propertyCode}
                    </button>
                    {propertyType && <p className="text-xs text-muted-foreground capitalize">{propertyType}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Unit</p>
                    <p className="font-semibold">{lease.unitLabel ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Lease details */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Detail label="Lease Type" value={leaseTypeLabel[lease.leaseType] ?? lease.leaseType} />
                <Detail label="Status" value={lease.isActive ? "Active" : "Closed"} badge={lease.isActive ? "success" : "secondary"} />
                <Detail label="Monthly Rent" value={formatCurrency(lease.monthlyRentAmount)} />
                <Detail label="Start Date" value={new Date(lease.startDate).toLocaleDateString()} />
                <Detail label="End Date" value={new Date(lease.endDate).toLocaleDateString()} />
                {lease.schemeType && (
                  <Detail label="Scheme" value={lease.schemeType.replace(/_/g, " ")} />
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => navigate({ to: `/leases/${lease.id}` })}>
                Open Full Lease <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* ── Financing tab ── */}
          <TabsContent value="financing" className="p-6">
            {mortgage ? (
              <FinancingMortgage lease={lease} mortgage={mortgage} navigate={navigate} />
            ) : rto ? (
              <FinancingRto rto={rto} navigate={navigate} />
            ) : (
              <EmptyState title="No financing yet" description="
                  This lease has no mortgage or rent-to-own plan attached.
                " />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ── Mortgage financing with inline amortization schedule ── */
function FinancingMortgage({
  lease,
  mortgage,
  navigate,
}: {
  lease: TenantLease;
  mortgage: { id: string; loanAmount: number; monthlyAmortization: number; loanTermMonths: number; interestRatePercent: number };
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: scenario, isLoading } = useMortgageScenario(mortgage.id);
  const schedule = scenario?.amortizationSchedule ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Mortgage</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: `/leases/${lease.id}/mortgage/${mortgage.id}` })}>
          Full View <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <Tabs defaultValue="terms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terms">Loan Terms</TabsTrigger>
          <TabsTrigger value="schedule">
            Amortization Schedule{schedule.length ? ` (${schedule.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="mt-4">
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Loan Amount" value={formatCurrency(mortgage.loanAmount)} />
            <Detail label="Monthly Payment" value={formatCurrency(mortgage.monthlyAmortization)} />
            <Detail label="Term" value={`${mortgage.loanTermMonths} months`} />
            <Detail label="Interest Rate" value={`${mortgage.interestRatePercent}%`} />
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : schedule.length > 0 ? (
          <div className="rounded-md border scroll-grid max-h-[440px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Balance</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Payment</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Principal</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Interest</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">End Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row: any) => (
                  <tr key={row.period ?? row.periodNumber} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-1.5 font-mono">{row.period ?? row.periodNumber}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{row.periodDate ? new Date(row.periodDate).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "—"}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(Number(row.beginningBalance))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums font-medium">{formatCurrency(Number(row.payment ?? row.monthlyPayment))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(Number(row.principal ?? row.principalPayment))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(Number(row.interest ?? row.interestPayment))}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(Number(row.endingBalance))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      ) : (
        <EmptyState title="No amortization schedule generated yet" />
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Rent-to-Own financing: split into Equity + Ledger sub-tabs ── */
function FinancingRto({
  rto,
  navigate,
}: {
  rto: { id: string; accumulatedEquity: number; totalContractValue: number };
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: fullContract, isLoading: loadingContract } = useRtoContract(rto.id);
  const { data: ledger, isLoading: loadingLedger } = useRtoLedger(rto.id);

  const progressPct = rto.totalContractValue > 0
    ? (rto.accumulatedEquity / rto.totalContractValue) * 100
    : 0;
  const progressLabel = rto.totalContractValue > 0 ? `${progressPct.toFixed(1)}%` : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Rent-to-Own</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: `/rto/${rto.id}` })}>
          Full View <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <Tabs defaultValue="equity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equity">Rent-to-Own Equity</TabsTrigger>
          <TabsTrigger value="ledger">
            Equity Ledger{ledger?.length ? ` (${ledger.length})` : ""}
          </TabsTrigger>
        </TabsList>

        {/* ── Equity summary sub-tab ── */}
        <TabsContent value="equity" className="mt-4 space-y-4">
          {/* Progress toward ownership */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Equity Progress</span>
              <span className="font-semibold">{progressLabel}</span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(rto.accumulatedEquity)} accrued</span>
              <span>{formatCurrency(rto.totalContractValue)} target</span>
            </div>
          </div>

          {loadingContract ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Contract Value" value={formatCurrency(rto.totalContractValue)} />
              <Detail label="Accumulated Equity" value={formatCurrency(rto.accumulatedEquity)} />
              <Detail label="Progress" value={progressLabel} />
              {fullContract && (
                <>
                  <Detail label="Option Fee" value={formatCurrency(fullContract.optionFeeAmount)} />
                  <Detail label="Monthly Rent Portion" value={formatCurrency(fullContract.monthlyRentPortion)} />
                  <Detail label="Monthly Equity Portion" value={formatCurrency(fullContract.monthlyEquityPortion)} />
                  <Detail label="Status" value={fullContract.status} badge={fullContract.status === "active" ? "success" : "secondary"} />
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Equity ledger sub-tab ── */}
        <TabsContent value="ledger" className="mt-4">
          {loadingLedger ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : ledger && ledger.length > 0 ? (
            <div className="rounded-md border scroll-grid max-h-[440px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background z-10">
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Running Balance</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry: any) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-1.5">{new Date(entry.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-1.5">
                        <Badge variant={entry.transactionType === "payment_credit" ? "success" : entry.transactionType === "forfeiture" ? "destructive" : "secondary"}>
                          {entry.transactionType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(Number(entry.amount))}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-medium">{formatCurrency(Number(entry.runningBalance))}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{entry.reference ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No equity transactions recorded yet" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Detail({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: "success" | "secondary" | "warning" | "destructive";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {badge ? (
        <Badge variant={badge} className="mt-1">{value}</Badge>
      ) : (
        <p className="font-semibold">{value}</p>
      )}
    </div>
  );
}

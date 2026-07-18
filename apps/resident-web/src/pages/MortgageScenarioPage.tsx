import { useMemo, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import { Separator } from "@elite-realty/shared-ui/components/ui";
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMortgageScenario, type AmortizationRow } from "@/hooks/use-mortgage";

function computeSchedule(
  loanAmount: number,
  annualRate: number,
  termMonths: number
): { monthlyPayment: number; totalInterest: number; schedule: AmortizationRow[] } {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    monthlyRate > 0
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
      : loanAmount / termMonths;

  const schedule: AmortizationRow[] = [];
  let balance = loanAmount;
  let cumulativeInterest = 0;
  for (let period = 1; period <= termMonths; period++) {
    const interest = balance * monthlyRate;
    let principal = monthlyPayment - interest;
    if (period === termMonths) {
      principal = balance;
    }
    const endingBalance = Math.max(0, balance - principal);
    cumulativeInterest += interest;
    schedule.push({
      period,
      beginningBalance: balance,
      payment: principal + interest,
      principal,
      interest,
      endingBalance,
      cumulativeInterest,
    });
    balance = endingBalance;
  }
  return { monthlyPayment, totalInterest: cumulativeInterest, schedule };
}

function money(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 24;

export default function MortgageScenarioPage() {
  const { scenarioId } = useParams({ from: "/protected/lease/mortgage/$scenarioId" });
  const navigate = useNavigate();
  const { data: scenario, isLoading, error } = useMortgageScenario(scenarioId);
  const [page, setPage] = useState(0);

  const computed = useMemo(() => {
    if (!scenario) return null;
    if (scenario.amortizationSchedule?.length) return scenario;
    const c = computeSchedule(scenario.loanAmount, scenario.interestRate, scenario.termMonths);
    return { ...scenario, ...c };
  }, [scenario]);

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/lease" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load scenario</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !computed) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const schedule = computed.amortizationSchedule;
  const pageCount = Math.ceil(schedule.length / PAGE_SIZE);
  const visible = schedule.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/lease" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/lease" })}>
          Back to Explorer
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-7 w-7" /> Mortgage Amortization
        </h1>
        <p className="text-muted-foreground">
          {computed.termMonths / 12} yr loan · {computed.downPaymentPercent}% down · {computed.interestRate}% APR
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="Loan Amount" value={money(computed.loanAmount)} />
        <SummaryCard
          icon={<Calendar className="h-5 w-5" />}
          label="Monthly Payment"
          value={money(computed.monthlyPayment)}
          highlight
        />
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Total Interest" value={money(computed.totalInterest)} />
        <SummaryCard
          icon={<Calculator className="h-5 w-5" />}
          label="Total Paid"
          value={money(computed.totalPaid ?? computed.loanAmount + computed.totalInterest)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Amortization Schedule</CardTitle>
          <CardDescription>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, schedule.length)} of {schedule.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="border-b">
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Beginning Balance</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Principal</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Interest</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ending Balance</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cumulative Interest</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.period} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2 text-right font-medium">{row.period}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(row.beginningBalance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(row.payment)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(row.principal)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(row.interest)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(row.endingBalance)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-yellow-700">{money(row.cumulativeInterest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {pageCount}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={highlight ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}



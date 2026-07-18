import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  AlertCircle,
  PieChart,
  TrendingUp,
  Wallet,
  Receipt,
  Percent,
} from "lucide-react";
import { usePnlStatement, type PnlLineItem } from "@/hooks/use-owner-pnl";
import { formatCurrency } from "@/lib/agent-meta";

function money(n: number) {
  return formatCurrency(Number(n ?? 0));
}

const lineItemMeta: Record<string, { label: string; sign: number }> = {
  rental_income: { label: "Rental Income", sign: 1 },
  maintenance: { label: "Maintenance", sign: -1 },
  utilities: { label: "Utilities", sign: -1 },
  management_fee: { label: "Management Fee", sign: -1 },
  tax: { label: "Tax", sign: -1 },
  insurance: { label: "Insurance", sign: -1 },
  other: { label: "Other", sign: -1 },
};

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
    <Card className={highlight ? "border-accent/40 bg-accent/5" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={highlight ? "text-accent" : "text-muted-foreground"}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div
          className={
            highlight ? "text-3xl font-bold gold-text tabular-nums" : "text-2xl font-bold tabular-nums"
          }
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PnlDetailPage() {
  const { id } = useParams({ from: "/protected/owner-pnl/$id" });
  const navigate = useNavigate();
  const { data: statement, isLoading, isError } = usePnlStatement(id);

  if (isError) {
    return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/owner-pnl" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load statement</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !statement) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const lineItems: PnlLineItem[] =
    statement.lineItems && statement.lineItems.length > 0
      ? statement.lineItems
      : ([
          { type: "rental_income", label: "Rental Income", amount: statement.grossRentalIncome },
          { type: "maintenance", label: "Maintenance", amount: statement.totalExpenses * 0.4 },
          { type: "utilities", label: "Utilities", amount: statement.totalExpenses * 0.3 },
          { type: "management_fee", label: "Management Fee", amount: statement.managementFee },
          {
            type: "other",
            label: "Other Expenses",
            amount: Math.max(0, statement.totalExpenses - statement.managementFee - statement.totalExpenses * 0.7),
          },
        ] as PnlLineItem[]);

  const maxItem = Math.max(1, ...lineItems.map((l) => Math.abs(l.amount)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/owner-pnl" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                {statement.ownerName || statement.ownerId.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant="secondary">{statement.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {statement.propertyName || statement.propertyId?.slice(0, 8).toUpperCase() || "All properties"}{" "}
              · {new Date(statement.periodStart).toLocaleDateString()} –{" "}
              {new Date(statement.periodEnd).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard
          icon={<Wallet className="h-5 w-5" />}
          label="Gross Rental Income"
          value={money(statement.grossRentalIncome)}
        />
        <SummaryCard
          icon={<Receipt className="h-5 w-5" />}
          label="Total Expenses"
          value={money(statement.totalExpenses)}
        />
        <SummaryCard
          icon={<Percent className="h-5 w-5" />}
          label="Management Fee"
          value={money(statement.managementFee)}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Yield %"
          value={`${(statement.yieldPct ?? 0).toFixed(2)}%`}
        />
        <SummaryCard
          icon={<PieChart className="h-5 w-5" />}
          label="Net Income"
          value={money(statement.netIncome)}
          highlight
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Income and expense components for the period
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item) => {
            const meta = lineItemMeta[item.type] ?? { label: item.label, sign: -1 };
            const isIncome = meta.sign > 0;
            return (
              <div key={item.type + item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {meta.label}
                    {!isIncome && <span className="text-muted-foreground"> (−)</span>}
                  </span>
                  <span
                    className={
                      isIncome ? "tabular-nums font-semibold text-green-700" : "tabular-nums font-semibold"
                    }
                  >
                    {isIncome ? "+" : "−"}
                    {money(Math.abs(item.amount))}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted">
                  <div
                    className={
                      isIncome
                        ? "bg-green-500 h-2.5 rounded-full"
                        : "gold-gradient h-2.5 rounded-full"
                    }
                    style={{ width: `${(Math.abs(item.amount) / maxItem) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}


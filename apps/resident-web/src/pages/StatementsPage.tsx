import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Wallet,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Building2,
} from "lucide-react";
import {
  useMyStatements,
  STATEMENT_STATUS_LABELS,
  formatCurrency,
  formatDate,
  type StatementStatus,
} from "@/hooks/use-statements";

const statusVariant: Record<
  StatementStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  draft: "outline",
  sent: "secondary",
  paid: "success",
  overdue: "destructive",
  cancelled: "default",
};

export default function StatementsPage() {
  const { data: statements, isLoading, isError } = useMyStatements();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Statements</h1>
        <p className="text-muted-foreground">Your periodic account statements</p>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Unable to load your statements. Please try again later.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : (statements ?? []).length === 0 ? (
        <Card className="border-accent/30 bg-gradient-to-br from-yellow-50 via-white to-teal-50">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="gold-gradient flex h-16 w-16 items-center justify-center rounded-2xl shadow-gold">
              <FileText className="h-8 w-8 text-sidebar-primary-foreground" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="font-serif text-2xl font-bold">No statements yet</h2>
              <p className="text-muted-foreground">
                When your property manager issues a statement, it will appear here with a full
                breakdown of billed and paid amounts.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(statements ?? []).map((s) => (
            <Card key={s.id} className="overflow-hidden border-accent/20">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="font-serif text-lg">Period {s.period}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(s.periodStart ?? s.createdAt)}
                    {s.periodEnd ? ` – ${formatDate(s.periodEnd)}` : ""}
                  </CardDescription>
                </div>
                <Badge variant={statusVariant[s.status]}>
                  {STATEMENT_STATUS_LABELS[s.status]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.propertyName && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" /> {s.propertyName}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat
                    icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
                    label="Billed"
                    value={formatCurrency(s.billedAmount)}
                  />
                  <Stat
                    icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                    label="Paid"
                    value={formatCurrency(s.paidAmount)}
                  />
                  <Stat
                    icon={<AlertCircle className="h-4 w-4 text-rose-600" />}
                    label="Balance"
                    value={formatCurrency(s.closingBalance)}
                    emphasize
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  emphasize,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <div className="mb-1 flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${emphasize ? "gold-text" : ""}`}>
        {value}
      </div>
    </div>
  );
}

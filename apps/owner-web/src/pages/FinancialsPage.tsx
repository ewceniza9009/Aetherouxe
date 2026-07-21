import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { DollarSign, TrendingUp, TrendingDown, Banknote, Loader2 } from 'lucide-react';
import { useMyFinancials, formatCurrency, formatDate } from '@/hooks/use-owner-portal';

export default function FinancialsPage() {
  const { data: financials, isLoading } = useMyFinancials();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summary = financials?.summary;
  const statements = financials?.statements ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Statements</h1>
        <p className="text-muted-foreground">
          P&L statements, distributions, and performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.statementCount ?? 0} statements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatCurrency(summary?.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Total expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalNetIncome)}</div>
            <p className="text-xs text-muted-foreground">After expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avgYield ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Across portfolio</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance & Net Yield Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statements.map((s) => {
              const rev = Number(s.grossRentalIncome) || 1;
              const netPct = Math.min(
                100,
                Math.max(0, Math.round(((Number(s.netIncome) || 0) / rev) * 100)),
              );
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {s.propertyName} ({formatDate(s.periodStart)})
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      {formatCurrency(s.netIncome)} ({netPct}% Margin)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${netPct}%` }}
                    />
                    <div
                      className="bg-rose-400 h-full transition-all duration-500"
                      style={{ width: `${100 - netPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No financial statements yet
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Period
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Net Income
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Yield
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm font-medium">{s.propertyName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(s.periodStart)} - {formatDate(s.periodEnd)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(s.grossRentalIncome)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        -{formatCurrency(s.expenses)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(s.netIncome)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{s.yield}%</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <Badge
                          className={
                            s.status === 'issued'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

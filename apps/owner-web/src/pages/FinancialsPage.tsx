import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { DollarSign, TrendingUp, TrendingDown, Banknote } from "lucide-react";

export default function FinancialsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Statements</h1>
        <p className="text-muted-foreground">P&L statements, distributions, and performance metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.84M</div>
            <p className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +14.2% vs last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.12M</div>
            <p className="text-xs text-green-600 flex items-center gap-1"><TrendingDown className="h-3 w-3" /> -2.8% vs last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income (YTD)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.72M</div>
            <p className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +22.5% vs last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distributions (YTD)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.03M</div>
            <p className="text-xs text-green-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +18.1% vs last year</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Q1 2026</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Q2 2026</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Q3 2026</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">YTD</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 text-sm font-medium">Rental Income</td>
                  <td className="px-4 py-3 text-sm text-right">$685,000</td>
                  <td className="px-4 py-3 text-sm text-right">$702,000</td>
                  <td className="px-4 py-3 text-sm text-right">$412,000</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">$1,799,000</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 text-sm font-medium">RTO Option Fees</td>
                  <td className="px-4 py-3 text-sm text-right">$42,000</td>
                  <td className="px-4 py-3 text-sm text-right">$38,000</td>
                  <td className="px-4 py-3 text-sm text-right">$24,000</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">$104,000</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 text-sm font-medium">Commercial Leases</td>
                  <td className="px-4 py-3 text-sm text-right">$210,000</td>
                  <td className="px-4 py-3 text-sm text-right">$215,000</td>
                  <td className="px-4 py-3 text-sm text-right">$129,000</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">$554,000</td>
                </tr>
                <tr className="border-b bg-muted/30 font-medium">
                  <td className="px-4 py-3 text-sm">Total Revenue</td>
                  <td className="px-4 py-3 text-sm text-right">$937,000</td>
                  <td className="px-4 py-3 text-sm text-right">$955,000</td>
                  <td className="px-4 py-3 text-sm text-right">$565,000</td>
                  <td className="px-4 py-3 text-sm text-right">$2,457,000</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 text-sm font-medium">Operating Expenses</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">-$382,000</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">-$375,000</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">-$224,000</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">-$981,000</td>
                </tr>
                <tr className="bg-primary/5 font-semibold">
                  <td className="px-4 py-3 text-sm">Net Income</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">$555,000</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">$580,000</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">$341,000</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">$1,476,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribution History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { date: "Jul 1, 2026", amount: "$172,000", type: "Quarterly", status: "pending" },
              { date: "Apr 1, 2026", amount: "$165,000", type: "Quarterly", status: "paid" },
              { date: "Jan 2, 2026", amount: "$158,000", type: "Quarterly", status: "paid" },
              { date: "Oct 1, 2025", amount: "$142,000", type: "Quarterly", status: "paid" },
            ].map((d, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{d.date}</p>
                  <p className="text-xs text-muted-foreground">{d.type} Distribution</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{d.amount}</span>
                  <Badge variant={d.status === "paid" ? "success" : "warning"}>{d.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Cash-on-Cash Return</span>
              <span className="font-semibold text-green-600">9.8%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-green-500" style={{ width: "65%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Internal Rate of Return (IRR)</span>
              <span className="font-semibold text-green-600">14.2%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-primary" style={{ width: "75%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Equity Multiple</span>
              <span className="font-semibold">1.85x</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: "62%" }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Debt Service Coverage Ratio</span>
              <span className="font-semibold">1.42x</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-2 rounded-full bg-yellow-500" style={{ width: "71%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



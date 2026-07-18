import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/agent-meta";

const agingBuckets = [
  { label: "Current (0-30 days)", amount: 625000, percentage: 62, color: "bg-green-500" },
  { label: "31-60 days", amount: 148000, percentage: 15, color: "bg-yellow-500" },
  { label: "61-90 days", amount: 96000, percentage: 10, color: "bg-orange-500" },
  { label: "Over 90 days", amount: 131000, percentage: 13, color: "bg-red-500" },
];

export default function FinancePage() {
  return (
    <div className="space-y-6 flex flex-col ">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-muted-foreground">Revenue, expenses, and AR aging overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (MTD)</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(847230)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12.5% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(312450)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> -3.2% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(534780)}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +18.3% vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AR Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(1002000)}</div>
            <p className="text-xs text-red-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +2.1% vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AR Aging Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agingBuckets.map((bucket) => (
                <div key={bucket.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{bucket.label}</span>
                    <span className="font-medium">{formatCurrency(bucket.amount)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${bucket.color}`} style={{ width: `${bucket.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Rental Income</span>
                <span className="font-medium">{formatCurrency(685000)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-primary" style={{ width: "81%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">RTO Option Fees</span>
                <span className="font-medium">{formatCurrency(89000)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: "11%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Commercial Leases</span>
                <span className="font-medium">{formatCurrency(73230)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: "8%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border scroll-grid">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Property</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "2026-07-14", desc: "Rent Collection", property: "Maple Towers", type: "Income", amount: 142000, status: "completed" },
                  { date: "2026-07-13", desc: "Maintenance Invoice", property: "Cedar Heights", type: "Expense", amount: -4200, status: "paid" },
                  { date: "2026-07-12", desc: "RTO Option Fee", property: "Oakwood Estates", type: "Income", amount: 12000, status: "completed" },
                  { date: "2026-07-11", desc: "Utility Payment", property: "Riverfront Plaza", type: "Expense", amount: -3800, status: "pending" },
                  { date: "2026-07-10", desc: "Security Deposit Return", property: "Sunset Villas", type: "Expense", amount: -2400, status: "paid" },
                ].map((txn, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{txn.date}</td>
                    <td className="px-4 py-3 text-sm">{txn.desc}</td>
                    <td className="px-4 py-3 text-sm">{txn.property}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={txn.type === "Income" ? "success" : "destructive"}>{txn.type}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${txn.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {txn.amount >= 0 ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={txn.status === "completed" ? "success" : txn.status === "pending" ? "warning" : "secondary"}>{txn.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { useAuth } from '@elite-realty/shared-ui/hooks';
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
import { formatCurrency } from '@elite-realty/shared-ui/lib/utils';
import {
  TrendingUp,
  Building,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function PortfolioAnalyticsPage() {
  const { user } = useAuth();
  const ownerId = user?.id || '';

  const {
    data: portfolioData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['owner-portfolio-summary', ownerId],
    queryFn: async () => {
      if (!ownerId) return null;
      const res = await api.get(`/owner-pnl/portfolio/${ownerId}`);
      return res.data;
    },
    enabled: !!ownerId,
  });

  const metrics = portfolioData?.metrics ?? {
    totalAssetValue: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    monthlyRentalIncome: 0,
    annualGrossRent: 0,
    grossYieldPct: 0,
    capRatePct: 0,
    totalHistoricalGross: 0,
    totalHistoricalExpenses: 0,
    totalHistoricalNet: 0,
  };

  const cashflowChartData = portfolioData?.cashflowHistory ?? [];
  const unitsList = portfolioData?.units ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Portfolio &amp; Yield Analytics
            </h1>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              Live Audited
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time asset valuation, Net Operating Income (NOI), cap rates, and lease
            distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Download className="w-4 h-4" />
            Export Statement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/70 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Portfolio Valuation
            </CardTitle>
            <Building className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(metrics.totalAssetValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metrics.totalUnits} Total Registered Units</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/70 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Rental Yield (Annual)
            </CardTitle>
            <Percent className="w-4 h-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-sky-400">{metrics.grossYieldPct}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Cap Rate: {metrics.capRatePct}% NOI</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/70 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Monthly Gross Inflow
            </CardTitle>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(metrics.monthlyRentalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              <span>Annual: {formatCurrency(metrics.annualGrossRent)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/70 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Occupancy Health
            </CardTitle>
            <Users className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-400">{metrics.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {metrics.occupiedUnits} of {metrics.totalUnits} Units Leased
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Recharts Graph */}
      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">
                Monthly Cash Flow &amp; Expense Distribution
              </CardTitle>
              <CardDescription>
                Historical gross rent collected vs. operating expenses and net distributions
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Past 6 Months
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cashflowChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="grossIncome" name="Gross Rent" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="expenses"
                  name="Operating Expenses"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="netIncome" name="Net Yield" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Unit Portfolio List */}
      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Owned Real Estate Assets</CardTitle>
              <CardDescription>
                Individual unit performance, active lease agreements, and tenancy status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/80 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="py-3 px-4">Unit &amp; Property</th>
                  <th className="py-3 px-4">Layout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Asset Value</th>
                  <th className="py-3 px-4">Current Lease</th>
                  <th className="py-3 px-4 text-right">Monthly Rent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {unitsList.map((unit: any) => (
                  <tr key={unit.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">{unit.unitNumber}</div>
                      <div className="text-xs text-muted-foreground">{unit.propertyName}</div>
                    </td>
                    <td className="py-3.5 px-4 capitalize text-xs text-muted-foreground font-medium">
                      {unit.unitType.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={
                          unit.status === 'occupied' || unit.status === 'rented'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs capitalize'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs capitalize'
                        }
                      >
                        {unit.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      {unit.listPrice ? formatCurrency(Number(unit.listPrice)) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {unit.activeLease ? (
                        <div>
                          <span className="font-medium text-foreground">
                            {unit.activeLease.tenantName}
                          </span>
                          <div className="text-muted-foreground">
                            Until {unit.activeLease.endDate}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Vacant / Available</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      {unit.activeLease ? formatCurrency(unit.activeLease.monthlyRent) : '—'}
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

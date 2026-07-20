import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import {
  Building2,
  DollarSign,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { usePortfolioStats, useMyProperties, formatCurrency } from '@/hooks/use-owner-portal';

export default function OwnerDashboardPage() {
  const { data: stats, isLoading: loadingStats } = usePortfolioStats();
  const { data: properties, isLoading: loadingProps } = useMyProperties();

  const isLoading = loadingStats || loadingProps;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const portfolioStats = [
    {
      title: 'Properties Owned',
      value: stats?.totalProperties ?? 0,
      icon: Building2,
      change: `${stats?.totalUnits ?? 0} units`,
      positive: true,
    },
    {
      title: 'Occupancy Rate',
      value: `${stats?.occupancyRate ?? 0}%`,
      icon: TrendingUp,
      change: `${stats?.occupiedUnits ?? 0}/${stats?.totalUnits ?? 0} occupied`,
      positive: (stats?.occupancyRate ?? 0) >= 80,
    },
    {
      title: 'Average Yield',
      value: `${stats?.avgYield ?? 0}%`,
      icon: PieChart,
      change: 'across portfolio',
      positive: (stats?.avgYield ?? 0) > 0,
    },
    {
      title: 'Net Income',
      value: formatCurrency(stats?.totalNetIncome),
      icon: DollarSign,
      change: `${formatCurrency(stats?.totalGrossIncome)} gross`,
      positive: (stats?.totalNetIncome ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here is your investment overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {portfolioStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p
                  className={`text-xs flex items-center gap-1 ${stat.positive ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stat.positive ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(!properties || properties.length === 0) && (
              <p className="text-sm text-muted-foreground">No properties yet</p>
            )}
            {properties?.map((prop) => (
              <div
                key={prop.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{prop.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {prop.propertyType.replace(/_/g, ' ')} · {prop.totalUnits} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{prop.occupancy}% occupied</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(prop.monthlyIncome)}/mo
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold">{formatCurrency(stats?.totalGrossIncome)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Operating Expenses</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(stats?.totalExpenses)}
              </span>
            </div>
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Net Income</span>
              <span className="font-bold text-green-600">
                {formatCurrency(stats?.totalNetIncome)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

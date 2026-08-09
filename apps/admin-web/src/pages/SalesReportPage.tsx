import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { api } from '@elite-realty/shared-ui/lib/api';
import { Building2, DollarSign, PiggyBank, Receipt } from 'lucide-react';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { GridState } from '@/components/GridToolbar';
import { useListQuery } from '@/hooks/use-list-query';
import { ListPager } from '@/components/ListPager';
import { Input } from '@elite-realty/shared-ui/components/ui';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

export default function SalesReportPage() {
  const {
    data: kpis,
    isLoading: isKpisLoading,
    isError: isKpisError,
    refetch: refetchKpis,
  } = useQuery({
    queryKey: ['sales-report-kpis'],
    queryFn: async () => {
      const res = await api.get('/reports/sales/kpis');
      return res.data.data;
    },
  });

  const propertyQuery = useListQuery(5);
  const ledgerQuery = useListQuery(10);

  const { data: propertiesRes, isLoading: isPropsLoading } = useQuery({
    queryKey: ['sales-report-properties', propertyQuery.query],
    queryFn: async () => {
      const params = new URLSearchParams(propertyQuery.query as any).toString();
      const res = await api.get(`/reports/sales/property-performance?${params}`);
      return res.data;
    },
  });

  const { data: ledgerRes, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['sales-report-ledger', ledgerQuery.query],
    queryFn: async () => {
      const params = new URLSearchParams(ledgerQuery.query as any).toString();
      const res = await api.get(`/reports/sales/ledger?${params}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Receivables</h1>
          <p className="text-muted-foreground">
            Monitor total contract values and pending receivables
          </p>
        </div>
      </div>

      <GridState
        isLoading={isKpisLoading}
        isError={isKpisError}
        isEmpty={!kpis}
        onRetry={() => refetchKpis()}
      >
        {kpis && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales Volume</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(kpis.totalSalesVolume)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total Contract Values booked</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accounts Receivable</CardTitle>
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(kpis.totalAccountsReceivable)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Outstanding balances to collect
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.unitsSold}</div>
                  <p className="text-xs text-muted-foreground mt-1">Units officially contracted</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Remaining</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.totalUnits - kpis.unitsSold}</div>
                  <p className="text-xs text-muted-foreground mt-1">Available / other units</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Property Performance</CardTitle>
                  <Input
                    placeholder="Search properties..."
                    className="w-48 h-8"
                    value={propertyQuery.search}
                    onChange={(e) => propertyQuery.setSearch(e.target.value)}
                  />
                </CardHeader>
                <CardContent>
                  <GridState
                    isLoading={isPropsLoading}
                    isError={false}
                    onRetry={() => {}}
                    isEmpty={!propertiesRes?.data?.length}
                  >
                    <div className="rounded-md border">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th
                              {...propertyQuery.sortHeader('propertyName', 'px-4 py-3 font-medium')}
                            >
                              Property Name{propertyQuery.sortIndicator('propertyName')}
                            </th>
                            <th {...propertyQuery.sortHeader('unitsSold', 'px-4 py-3 font-medium')}>
                              Sold / Total{propertyQuery.sortIndicator('unitsSold')}
                            </th>
                            <th
                              {...propertyQuery.sortHeader(
                                'salesVolume',
                                'px-4 py-3 font-medium text-right',
                              )}
                            >
                              Sales Volume{propertyQuery.sortIndicator('salesVolume')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertiesRes?.data?.map((p: any) => (
                            <tr
                              key={p.propertyId}
                              className="border-b last:border-0 hover:bg-muted/30"
                            >
                              <td className="px-4 py-3">{p.propertyName}</td>
                              <td className="px-4 py-3">
                                {p.unitsSold} / {p.totalUnits}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(p.salesVolume)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {propertiesRes && propertiesRes.meta && (
                      <div className="mt-4">
                        <ListPager
                          meta={propertiesRes.meta}
                          page={propertyQuery.page}
                          onPageChange={propertyQuery.setPage}
                        />
                      </div>
                    )}
                  </GridState>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle>Recent Sales Ledger</CardTitle>
                  <Input
                    placeholder="Search unit or buyer..."
                    className="w-48 h-8"
                    value={ledgerQuery.search}
                    onChange={(e) => ledgerQuery.setSearch(e.target.value)}
                  />
                </CardHeader>
                <CardContent>
                  <GridState
                    isLoading={isLedgerLoading}
                    isError={false}
                    onRetry={() => {}}
                    isEmpty={!ledgerRes?.data?.length}
                  >
                    <div className="rounded-md border">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th {...ledgerQuery.sortHeader('unitNumber', 'px-4 py-3 font-medium')}>
                              Unit{ledgerQuery.sortIndicator('unitNumber')}
                            </th>
                            <th {...ledgerQuery.sortHeader('buyerName', 'px-4 py-3 font-medium')}>
                              Buyer{ledgerQuery.sortIndicator('buyerName')}
                            </th>
                            <th {...ledgerQuery.sortHeader('schemeType', 'px-4 py-3 font-medium')}>
                              Scheme{ledgerQuery.sortIndicator('schemeType')}
                            </th>
                            <th
                              {...ledgerQuery.sortHeader(
                                'contractValue',
                                'px-4 py-3 font-medium text-right',
                              )}
                            >
                              Value{ledgerQuery.sortIndicator('contractValue')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgerRes?.data?.map((s: any) => (
                            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-4 py-3">{s.unitNumber}</td>
                              <td className="px-4 py-3">{s.buyerName}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline">{s.schemeType.replace(/_/g, ' ')}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(s.contractValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {ledgerRes && ledgerRes.meta && (
                      <div className="mt-4">
                        <ListPager
                          meta={ledgerRes.meta}
                          page={ledgerQuery.page}
                          onPageChange={ledgerQuery.setPage}
                        />
                      </div>
                    )}
                  </GridState>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </GridState>
    </div>
  );
}

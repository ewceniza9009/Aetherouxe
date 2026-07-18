import { useState } from 'react';
import { GridState } from '@/components/GridToolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { useGeneralLedgerEntries, useChartOfAccounts } from '@/hooks/use-gl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GeneralLedgerPage() {
  const { data: entries, isLoading: loadingEntries } = useGeneralLedgerEntries();
  const { data: accounts, isLoading: loadingAccounts } = useChartOfAccounts();

  return (
    <div className="space-y-6 flex flex-col ">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">General Ledger</h2>
        <p className="text-muted-foreground mt-2">
          View all journal entries and your Chart of Accounts.
        </p>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="entries">
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="coa">
            Chart of Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="m-0">
          <Card>
            <CardContent className="p-0">
              <GridState
                isLoading={loadingEntries}
                isError={false}
                isEmpty={!entries?.length}
                onRetry={() => {}}
                emptyState={<EmptyState title="No journal entries found" />}
              >
                <div className="rounded-md scroll-grid overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries?.map((entry: any) => (
                        entry.lines.map((line: any, idx: number) => (
                          <TableRow key={line.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {idx === 0 ? format(new Date(entry.date), 'MMM dd, yyyy') : ''}
                            </TableCell>
                            <TableCell className="font-medium">
                              {idx === 0 ? (
                                <div className="flex flex-col">
                                  <span>{entry.reference}</span>
                                  <span className="text-xs text-muted-foreground font-normal">{entry.notes}</span>
                                </div>
                              ) : ''}
                            </TableCell>
                            <TableCell>
                              <span className={Number(line.creditAmount) > 0 ? "ml-4 text-muted-foreground" : ""}>
                                {line.account?.accountCode} - {line.account?.name}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {Number(line.debitAmount) > 0 ? formatCurrency(line.debitAmount) : ''}
                            </TableCell>
                            <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400">
                              {Number(line.creditAmount) > 0 ? formatCurrency(line.creditAmount) : ''}
                            </TableCell>
                          </TableRow>
                        ))
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </GridState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coa" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Active Accounts</CardTitle>
              <CardDescription>All accounts in your Chart of Accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : !accounts?.length ? (
                <EmptyState title="No accounts found" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account: any) => (
                    <div key={account.id} className="p-4 rounded-lg border bg-card text-card-foreground flex items-center justify-between shadow-sm">
                      <div>
                        <div className="text-lg font-mono font-medium">{account.accountCode}</div>
                        <div className="text-sm text-muted-foreground">{account.name}</div>
                      </div>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {account.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

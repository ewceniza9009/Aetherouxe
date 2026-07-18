import { useState } from 'react';
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
import { Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function GeneralLedgerPage() {
  const { data: entries, isLoading: loadingEntries } = useGeneralLedgerEntries();
  const { data: accounts, isLoading: loadingAccounts } = useChartOfAccounts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">General Ledger</h2>
        <p className="text-muted-foreground mt-2">
          View all journal entries and your Chart of Accounts.
        </p>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
          <TabsTrigger value="entries" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="coa" className="data-[state=active]:bg-gold data-[state=active]:text-black">
            Chart of Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="m-0">
          <div className="rounded-md border border-white/10 bg-black/40 backdrop-blur-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/60">Date</TableHead>
                  <TableHead className="text-white/60">Reference</TableHead>
                  <TableHead className="text-white/60">Account</TableHead>
                  <TableHead className="text-right text-white/60">Debit</TableHead>
                  <TableHead className="text-right text-white/60">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEntries ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/40" />
                    </TableCell>
                  </TableRow>
                ) : !entries?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-white/40">
                      No journal entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry: any) => (
                    // We render a row for each line in the entry, grouped visually
                    entry.lines.map((line: any, idx: number) => (
                      <TableRow key={line.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="text-white/70">
                          {idx === 0 ? format(new Date(entry.date), 'MMM dd, yyyy') : ''}
                        </TableCell>
                        <TableCell className="font-medium text-white/90">
                          {idx === 0 ? (
                            <div className="flex flex-col">
                              <span>{entry.reference}</span>
                              <span className="text-xs text-white/40 font-normal">{entry.notes}</span>
                            </div>
                          ) : ''}
                        </TableCell>
                        <TableCell className="text-white/80">
                          <span className={Number(line.creditAmount) > 0 ? "ml-4 text-white/60" : ""}>
                            {line.account?.accountCode} - {line.account?.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-400">
                          {Number(line.debitAmount) > 0 ? formatCurrency(line.debitAmount) : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono text-amber-400">
                          {Number(line.creditAmount) > 0 ? formatCurrency(line.creditAmount) : ''}
                        </TableCell>
                      </TableRow>
                    ))
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="coa" className="m-0">
          <div className="rounded-md border border-white/10 bg-black/40 backdrop-blur-xl p-6">
            <h3 className="text-xl font-medium text-white mb-4">Active Accounts</h3>
            {loadingAccounts ? (
               <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts?.map((account: any) => (
                  <div key={account.id} className="p-4 rounded-lg border border-white/10 bg-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-mono text-gold">{account.accountCode}</div>
                      <div className="text-sm text-white/80">{account.name}</div>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-white/60 uppercase text-[10px]">
                      {account.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

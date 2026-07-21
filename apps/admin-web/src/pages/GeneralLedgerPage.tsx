import { Fragment, useState, useMemo, useCallback, useEffect } from 'react';
import { GridState } from '@/components/GridToolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  useGeneralLedgerEntries,
  useChartOfAccounts,
  type GlEntry,
  type GlEntryLine,
  type Account,
  type GlEntriesResponse,
} from '@/hooks/use-gl';
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
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/agent-meta';
import { format } from 'date-fns';
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import { useDebouncedValue } from '@/hooks/use-debounce';

const PAGE_SIZE = 50;

const typeOrder = ['asset', 'liability', 'equity', 'revenue', 'expense'];
const typeLabel: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};
const typeBadgeClass: Record<string, string> = {
  asset: 'bg-blue-500/20 text-blue-600 border-blue-500/50',
  liability: 'bg-amber-500/20 text-amber-600 border-amber-500/50',
  equity: 'bg-purple-500/20 text-purple-600 border-purple-500/50',
  revenue: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/50',
  expense: 'bg-red-500/20 text-red-600 border-red-500/50',
};

const functionOrder = ['sale', 'commission', 'disbursement', 'service', 'other'];
const functionLabel: Record<string, string> = {
  sale: 'Sales',
  commission: 'Commissions',
  disbursement: 'Disbursements / AP',
  service: 'Service / Maintenance',
  other: 'Other',
};
const functionBadgeClass: Record<string, string> = {
  sale: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/50',
  commission: 'bg-blue-500/20 text-blue-600 border-blue-500/50',
  disbursement: 'bg-amber-500/20 text-amber-600 border-amber-500/50',
  service: 'bg-purple-500/20 text-purple-600 border-purple-500/50',
  other: 'bg-gray-500/20 text-gray-600 border-gray-500/50',
};

function classifyEntry(entry: GlEntry): string {
  const ref = (entry.reference ?? '').toLowerCase();
  const notes = (entry.notes ?? '').toLowerCase();
  if (notes.includes('sale contract signed') || notes.includes('sale')) return 'sale';
  if (ref.startsWith('comm-') || notes.includes('commission')) return 'commission';
  if (ref.startsWith('ap-ap-') || (ref.startsWith('ap-') && notes.includes('work order')))
    return 'service';
  if (ref.startsWith('disb-') || (ref.startsWith('ap-') && !ref.startsWith('ap-ap-')))
    return 'disbursement';
  if (notes.includes('work order') || notes.includes('maintenance')) return 'service';
  return 'other';
}

function glSourceLink(entry: GlEntry): { href: string } | null {
  if (entry.sourceType === 'SERVICE_REQUEST' && entry.sourceId) {
    return { href: `/service-requests/${entry.sourceId}` };
  }
  if (entry.sourceType === 'COMMISSION' && entry.parentId) {
    return { href: `/agents/${entry.parentId}` };
  }
  if (entry.sourceType === 'TITLE_TRANSFER' && entry.parentId) {
    return { href: `/properties/${entry.parentId}` };
  }
  if (entry.sourceType === 'DISBURSEMENT') {
    return { href: '/finance/disbursements' };
  }
  return null;
}

export default function GeneralLedgerPage() {
  const [entryFilter, setEntryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebouncedValue(search, 300);
  const isFiltered = entryFilter !== 'all' || !!debouncedSearch;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, entryFilter]);

  const { data: entriesResponse, isLoading: loadingEntries } = useGeneralLedgerEntries({
    search: debouncedSearch || undefined,
    function: entryFilter !== 'all' ? entryFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: accounts, isLoading: loadingAccounts } = useChartOfAccounts();

  const displayData = entriesResponse as GlEntriesResponse | undefined;
  const entries = displayData?.data ?? [];
  const totalEntries = displayData?.total ?? 0;
  const totalPages = displayData?.totalPages ?? 1;
  const safePage = Math.min(page, totalPages);

  const groupedEntries = useMemo(() => {
    if (isFiltered) return [];
    const groups = new Map<string, GlEntry[]>();
    for (const entry of entries) {
      const fn = classifyEntry(entry);
      const list = groups.get(fn) ?? [];
      list.push(entry);
      groups.set(fn, list);
    }
    return functionOrder
      .filter((fn) => groups.has(fn))
      .map((fn) => ({
        fn,
        label: functionLabel[fn],
        badgeClass: functionBadgeClass[fn],
        entries: groups.get(fn)!,
      }));
  }, [entries, isFiltered]);

  const toggleGroup = useCallback((fn: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(fn)) next.delete(fn);
      else next.add(fn);
      return next;
    });
  }, []);

  const totals = useMemo(() => {
    return displayData?.summary ?? { totalDebit: 0, totalCredit: 0, balance: 0 };
  }, [displayData]);

  const groupedAccounts = useMemo(() => {
    if (!accounts) return [];
    const sorted = [...accounts].sort((a: Account, b: Account) => {
      const ta = typeOrder.indexOf(a.type);
      const tb = typeOrder.indexOf(b.type);
      if (ta !== tb) return ta - tb;
      return a.accountCode.localeCompare(b.accountCode);
    });
    const groups = new Map<string, Account[]>();
    for (const acc of sorted) {
      const list = groups.get(acc.type) ?? [];
      list.push(acc);
      groups.set(acc.type, list);
    }
    return Array.from(groups.entries());
  }, [accounts]);

  const isEmpty = !loadingEntries && entries.length === 0;

  return (
    <div className="space-y-6 flex flex-col ">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">General Ledger</h2>
        <p className="text-muted-foreground mt-2">
          Journal entries, Chart of Accounts, and financial overview.
        </p>
      </div>

      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="coa">Chart of Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="m-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Debit</p>
                  <p className="text-lg font-semibold font-mono text-emerald-600">
                    {formatCurrency(totals.totalDebit)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Credit</p>
                  <p className="text-lg font-semibold font-mono text-amber-600">
                    {formatCurrency(totals.totalCredit)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Scale className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-semibold font-mono text-blue-600">
                    {formatCurrency(totals.balance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <GridState
                isLoading={loadingEntries}
                isError={false}
                isEmpty={isEmpty}
                onRetry={() => {}}
                emptyState={<EmptyState title="No journal entries found" />}
              >
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search entries, accounts..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={entryFilter} onValueChange={setEntryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Entries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Entries</SelectItem>
                      <SelectItem value="commission">Commissions</SelectItem>
                      <SelectItem value="service">Service / Maintenance</SelectItem>
                      <SelectItem value="disbursement">Disbursements</SelectItem>
                      <SelectItem value="sale">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md scroll-grid overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[130px]">Date</TableHead>
                        <TableHead className="w-[220px]">Reference</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right w-[140px]">Debit</TableHead>
                        <TableHead className="text-right w-[140px]">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!isFiltered
                        ? groupedEntries.map((group) => (
                            <Fragment key={`grp-${group.fn}`}>
                              <TableRow
                                className="bg-muted/30 hover:bg-muted/40 cursor-pointer select-none"
                                onClick={() => toggleGroup(group.fn)}
                              >
                                <TableCell colSpan={5} className="py-2 px-4">
                                  <div className="flex items-center gap-2">
                                    {collapsed.has(group.fn) ? (
                                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <Badge
                                      variant="outline"
                                      className={`${group.badgeClass} text-xs`}
                                    >
                                      {group.label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {group.entries.length} entries
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {!collapsed.has(group.fn) &&
                                group.entries.map((entry: GlEntry) =>
                                  entry.lines.map((line: GlEntryLine, idx: number) => (
                                    <TableRow key={line.id} className="bg-card hover:bg-muted/30">
                                      {idx === 0 && (
                                        <TableCell
                                          rowSpan={entry.lines.length}
                                          className="text-muted-foreground whitespace-nowrap align-top py-4 border-r border-border/40"
                                        >
                                          {format(new Date(entry.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                      )}
                                      {idx === 0 && (
                                        <TableCell
                                          rowSpan={entry.lines.length}
                                          className="font-medium align-top py-4 border-r border-border/40"
                                        >
                                          <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-primary text-sm">
                                              {(() => {
                                                const link = glSourceLink(entry);
                                                return link ? (
                                                  <a
                                                    href={link.href}
                                                    className="underline-offset-4 hover:underline cursor-pointer text-primary"
                                                  >
                                                    {entry.reference}
                                                  </a>
                                                ) : (
                                                  <>{entry.reference}</>
                                                );
                                              })()}
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-tight">
                                              {entry.notes}
                                            </span>
                                          </div>
                                        </TableCell>
                                      )}
                                      <TableCell className="py-3 align-top">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-1.5 h-4 rounded-full ${Number(line.creditAmount) > 0 ? 'bg-amber-500/40' : 'bg-emerald-500/40'}`}
                                          />
                                          <span className="font-mono text-sm">
                                            {line.account?.accountCode}
                                          </span>
                                          <span className="text-muted-foreground/40">•</span>
                                          <span className="text-sm text-muted-foreground">
                                            {line.account?.name}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-sm py-3">
                                        {Number(line.debitAmount) > 0 ? (
                                          <span className="text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(line.debitAmount)}
                                          </span>
                                        ) : (
                                          ''
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-sm py-3">
                                        {Number(line.creditAmount) > 0 ? (
                                          <span className="text-amber-600 dark:text-amber-400">
                                            {formatCurrency(line.creditAmount)}
                                          </span>
                                        ) : (
                                          ''
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )),
                                )}
                            </Fragment>
                          ))
                        : entries.map((entry: GlEntry, entryIdx: number) =>
                            entry.lines.map((line: GlEntryLine, idx: number) => (
                              <TableRow
                                key={line.id}
                                className={
                                  entryIdx % 2 === 0
                                    ? 'bg-card hover:bg-muted/30'
                                    : 'bg-muted/10 hover:bg-muted/30'
                                }
                              >
                                {idx === 0 && (
                                  <TableCell
                                    rowSpan={entry.lines.length}
                                    className="text-muted-foreground whitespace-nowrap align-top py-4 border-r border-border/40"
                                  >
                                    {format(new Date(entry.date), 'MMM dd, yyyy')}
                                  </TableCell>
                                )}
                                {idx === 0 && (
                                  <TableCell
                                    rowSpan={entry.lines.length}
                                    className="font-medium align-top py-4 border-r border-border/40"
                                  >
                                    <div className="flex flex-col gap-1">
                                      <span className="font-semibold text-primary text-sm">
                                        {entry.reference}
                                      </span>
                                      <span className="text-xs text-muted-foreground leading-tight">
                                        {entry.notes}
                                      </span>
                                    </div>
                                  </TableCell>
                                )}
                                <TableCell className="py-3 align-top">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-1.5 h-4 rounded-full ${Number(line.creditAmount) > 0 ? 'bg-amber-500/40' : 'bg-emerald-500/40'}`}
                                    />
                                    <span className="font-mono text-sm">
                                      {line.account?.accountCode}
                                    </span>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="text-sm text-muted-foreground">
                                      {line.account?.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm py-3">
                                  {Number(line.debitAmount) > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(line.debitAmount)}
                                    </span>
                                  ) : (
                                    ''
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm py-3">
                                  {Number(line.creditAmount) > 0 ? (
                                    <span className="text-amber-600 dark:text-amber-400">
                                      {formatCurrency(line.creditAmount)}
                                    </span>
                                  ) : (
                                    ''
                                  )}
                                </TableCell>
                              </TableRow>
                            )),
                          )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    {totalEntries} entries in {groupedEntries.length} groups (page {safePage}/
                    {totalPages})
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {safePage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={safePage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </GridState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coa" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Active Accounts</CardTitle>
              <CardDescription>Grouped by account type, sorted by code.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : !groupedAccounts.length ? (
                <EmptyState title="No accounts found" />
              ) : (
                <div className="space-y-6">
                  {groupedAccounts.map(([type, accs]) => (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-semibold text-foreground">
                          {typeLabel[type] ?? type}
                        </h3>
                        <Badge variant="outline" className={typeBadgeClass[type] ?? ''}>
                          {accs.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {accs.map((account: Account) => (
                          <div
                            key={account.id}
                            className="p-3 rounded-lg border bg-card text-card-foreground flex items-center justify-between shadow-sm"
                          >
                            <div>
                              <div className="font-mono font-medium text-sm">
                                {account.accountCode}
                              </div>
                              <div className="text-xs text-muted-foreground">{account.name}</div>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${typeBadgeClass[account.type] ?? ''} uppercase text-[10px]`}
                            >
                              {account.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
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

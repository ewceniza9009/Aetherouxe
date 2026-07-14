import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, UserCheck, Users, ChevronDown, ChevronUp } from "lucide-react";
import {
  useAgents,
  type Agent,
  type AgentTierValue,
} from "@/hooks/use-agents";
import {
  TIER_LABELS,
  tierBadgeVariant,
  licenseStatusVariant,
  licenseDotColor,
  AGENT_STATUS_LABELS,
  agentStatusVariant,
  getInitials,
} from "@/lib/agent-meta";

export default function AgentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<AgentTierValue | "all">("all");
  const [internalOnly, setInternalOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading, isError } = useAgents({
    search: search || undefined,
    tier: tier === "all" ? undefined : tier,
    isInternal: internalOnly || undefined,
    limit: 100,
  });

  const agents = data?.data ?? [];

  const columnHelper = createColumnHelper<Agent>();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Agent",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-muted text-xs">
                {getInitials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-tight">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor("tier", {
        header: "Tier",
        cell: ({ getValue }) => {
          const t = getValue();
          return (
            <Badge variant={tierBadgeVariant(t)} className="capitalize">
              {TIER_LABELS[t]}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("isInternal", {
        header: "Type",
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Internal
            </Badge>
          ) : (
            <Badge variant="secondary">External</Badge>
          ),
      }),
      columnHelper.display({
        id: "manager",
        header: "Manager",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.managerName ?? "—"}
          </span>
        ),
      }),
      columnHelper.accessor("licenseStatus", {
        header: "License",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${licenseDotColor(status)}`}
              />
              <span className="text-sm capitalize">{status}</span>
            </div>
          );
        },
      }),
      columnHelper.accessor("transactionCount", {
        header: "# Transactions",
        cell: ({ getValue }) => (
          <span className="font-medium tabular-nums">{getValue() ?? 0}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <Badge variant={agentStatusVariant(status)}>
              {AGENT_STATUS_LABELS[status]}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: () => (
          <Button variant="ghost" size="sm">
            View
          </Button>
        ),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const table = useReactTable({
    data: agents,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real Estate Agents</h1>
          <p className="text-muted-foreground">
            Manage agent profiles, tiers, and commission assignments
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/agents/new" })}>
          <Plus className="mr-2 h-4 w-4" /> New Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Agent Roster</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name or license..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={tier}
                onValueChange={(v) => setTier(v as AgentTierValue | "all")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={internalOnly}
                  onChange={(e) => setInternalOnly(e.target.checked)}
                />
                Internal only
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-destructive">
              Failed to load agents. Please try again.
            </div>
          ) : agents.length === 0 ? (
            <div className="py-16 text-center">
              <UserCheck className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No agents found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adjust filters or add a new agent to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() &&
                              (sorting.find((s) => s.id === header.column.id)
                                ?.desc ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronUp className="h-3 w-3" />
                              ))}
                          </button>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate({ to: `/agents/${row.original.id}` })
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && !isError && data?.meta && data.meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {data.meta.page} of {data.meta.totalPages} ·{" "}
                {data.meta.total} agents
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

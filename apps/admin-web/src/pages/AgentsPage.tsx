import { useMemo, useState } from "react";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import {
  useAgents,
  type Agent,
  type AgentTierValue,
} from "@/hooks/use-agents";
import {
  TIER_LABELS,
  tierBadgeVariant,
  licenseDotColor,
  AGENT_STATUS_LABELS,
  agentStatusVariant,
  getInitials,
} from "@/lib/agent-meta";

export default function AgentsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [tier, setTier] = useState<AgentTierValue | "all">("all");
  const [internalOnly, setInternalOnly] = useState(false);

  const fullQuery = useMemo(
    () => ({
      ...query,
      tier: tier === "all" ? undefined : tier,
      isInternal: internalOnly || undefined,
    }),
    [query, tier, internalOnly]
  );

  const { data, isLoading, isError, refetch } = useAgents(fullQuery);

  const agents = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 flex flex-col ">
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

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search name or license…"
        filters={
          <>
            <Select value={tier} onValueChange={(v) => { setTier(v as AgentTierValue | "all"); resetPage(); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="external_broker">External Broker</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={internalOnly}
                onCheckedChange={(checked) => { setInternalOnly(checked); resetPage(); }}
              />
              Internal only
            </label>
          </>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={agents.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("name", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Agent{sortIndicator("name")}
                    </th>
                    <th {...sortHeader("tier", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Tier{sortIndicator("tier")}
                    </th>
                    <th {...sortHeader("isInternal", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Type{sortIndicator("isInternal")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Manager</th>
                    <th {...sortHeader("licenseStatus", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      License{sortIndicator("licenseStatus")}
                    </th>
                    <th {...sortHeader("transactionCount", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      # Transactions{sortIndicator("transactionCount")}
                    </th>
                    <th {...sortHeader("status", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("status")}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a: Agent) => (
                    <tr
                      key={a.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/agents/${a.id}` })}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            {a.avatarUrl && <AvatarImage src={a.avatarUrl} />}
                            <AvatarFallback className="bg-muted text-xs">
                              {getInitials(a.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium leading-tight">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tierBadgeVariant(a.tier)} className="capitalize">
                          {TIER_LABELS[a.tier]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {a.isInternal ? (
                          <Badge variant="outline" className="border-primary/40 text-primary">
                            Internal
                          </Badge>
                        ) : (
                          <Badge variant="secondary">External</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {a.managerName ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${licenseDotColor(a.licenseStatus)}`} />
                          <span className="text-sm capitalize">{a.licenseStatus}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {a.transactionCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={agentStatusVariant(a.status)}>
                          {AGENT_STATUS_LABELS[a.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate({ to: `/agents/${a.id}` });
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

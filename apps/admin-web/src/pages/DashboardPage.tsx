import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, FileText, DollarSign, TrendingUp, Activity,
  Plus, ArrowRight, Hammer, CheckCircle2, Clock, AlertTriangle,
  Layers, KeyRound, UserCheck, ShieldCheck, BadgeDollarSign,
  Wallet, FolderOpen, BellRing, Droplets, Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useProperties } from "@/hooks/use-properties";
import { useProjects } from "@/hooks/use-projects";
import { useLeases } from "@/hooks/use-leases";
import { useRtoContracts } from "@/hooks/use-rto";
import { useAgents } from "@/hooks/use-agents";
import { useCommissionAging } from "@/hooks/use-commissions";
import { useArAging, useCollectionCases } from "@/hooks/use-collections";
import { useBills } from "@/hooks/use-utilities";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useDocuments } from "@/hooks/use-documents";
import { usePortfolioKpis, useRevenueTrend } from "@/hooks/use-reports";
import type { PortfolioKpis } from "@/hooks/use-reports";
import { formatCurrency } from "@/lib/agent-meta";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: kpis } = usePortfolioKpis();
  const k = (kpis ?? {}) as PortfolioKpis;
  const { data: revenueTrend } = useRevenueTrend(6);

  const money = (n: number) =>
    formatCurrency(Number(n ?? 0));

  const stats = [
    { title: "Total Properties", value: (k.totalProperties ?? 0).toLocaleString(), icon: Building2, accent: "text-primary", sub: "Across portfolio" },
    { title: "Occupied Units", value: `${(k.occupiedUnits ?? 0)}/${(k.totalUnits ?? 0)}`, icon: Users, accent: "text-cyan-400", sub: `${k.occupancyRate ?? 0}% occupancy` },
    { title: "Active Leases", value: (k.activeLeases ?? 0).toLocaleString(), icon: FileText, accent: "text-success", sub: "Currently generating revenue" },
    { title: "Monthly Revenue", value: money(k.monthlyRecurringRevenue ?? 0), icon: DollarSign, accent: "text-warning", sub: "Recurring MRR" },
    { title: "Total Receivable", value: money(k.totalReceivable ?? 0), icon: TrendingUp, accent: "text-destructive", sub: "Outstanding AR" },
    { title: "Open Requests", value: (k.openServiceRequests ?? 0).toLocaleString(), icon: Activity, accent: "text-primary", sub: "Awaiting action" },
  ];

  const { data: recentProperties, isLoading: loadingRecent } = useProperties({
    page: 1,
    limit: 5,
    sort: "createdAt",
    order: "desc",
  });

  const { data: projectsData, isLoading: loadingProjects } = useProjects({
    page: 1,
    limit: 100,
  });

  const projects = projectsData?.data ?? [];
  const totalProjects = projectsData?.meta?.total ?? 0;
  const activeProjects = projects.filter((p) =>
    p.status === "pre_selling" || p.status === "construction" || p.status === "fit_out"
  ).length;
  const planningProjects = projects.filter((p) => p.status === "planning").length;
  const turnoverProjects = projects.filter((p) => p.status === "turnover").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  const greenBudgets = 0;
  const yellowBudgets = 0;
  const redBudgets = 0;

  const { data: activeLeasesData, isLoading: loadingLeases } = useLeases({
    page: 1,
    limit: 100,
    status: "active",
  });
  const activeLeases = activeLeasesData?.data ?? [];
  const activeLeaseCount = activeLeasesData?.meta?.total ?? activeLeases.length;
  const monthlyRentalIncome = activeLeases.reduce((sum, l) => sum + (l.monthlyRent ?? 0), 0);

  const { data: overdueData, isLoading: loadingOverdue } = useQuery({
    queryKey: ["overdue-payments"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("status", "pending");
      params.set("limit", "1");
      const { data } = await api.get<ApiResponse<unknown[]> & { meta: PaginationMeta }>(
        `/rental-payments?${params}`
      );
      return data.meta?.total ?? 0;
    },
  });
  const overdueCount = overdueData ?? 0;

  const { data: activeRtoData, isLoading: loadingActiveRto } = useRtoContracts({
    page: 1,
    limit: 100,
    status: "active",
  });
  const { data: defaultedRtoData, isLoading: loadingDefaultedRto } = useRtoContracts({
    page: 1,
    limit: 100,
    status: "defaulted",
  });
  const activeRtoContracts = activeRtoData?.data ?? [];
  const activeRtoCount = activeRtoData?.meta?.total ?? activeRtoContracts.length;
  const totalEquityAccumulated = activeRtoContracts.reduce(
    (sum, c) => sum + Number(c.accumulatedEquity ?? 0),
    0
  );
  const defaultedRtoCount = defaultedRtoData?.meta?.total ?? (defaultedRtoData?.data ?? []).length;

  const { data: agentsData, isLoading: loadingAgents } = useAgents({ limit: 200 });
  const agents = agentsData?.data ?? [];
  const totalAgents = agentsData?.meta?.total ?? agents.length;
  const compliantAgents = agents.filter((a) => a.licenseStatus === "compliant").length;
  const internalAgents = agents.filter((a) => a.isInternal).length;

  const { data: agingReport, isLoading: loadingAging } = useCommissionAging();
  const unpaidCommissions = agingReport?.totalUnpaid ?? 0;

  const { data: arReport, isLoading: loadingAr } = useArAging();
  const totalReceivable = arReport?.totalReceivable ?? 0;
  const { data: collectionCases, isLoading: loadingCases } = useCollectionCases();
  const openCasesCount = (collectionCases?.data ?? []).filter(
    (c) => c.status === "open" || c.status === "in_progress" || c.status === "escalated"
  ).length;

  const { data: utilityBillsData, isLoading: loadingUtilityBills } = useBills({
    page: 1,
    limit: 100,
  });
  const utilityBills = utilityBillsData?.data ?? [];
  const unpaidUtilityBills = utilityBills.filter(
    (b) => b.status === "pending" || b.status === "partially_paid" || b.status === "disputed"
  ).length;
  const unpaidUtilityAmount = utilityBills
    .filter((b) => b.status !== "paid" && b.status !== "waived")
    .reduce((sum, b) => sum + (b.amountDue ?? 0), 0);

  const { data: openRequestsData, isLoading: loadingRequests } = useServiceRequests({
    page: 1,
    limit: 100,
    status: "open",
  });
  const openRequests = openRequestsData?.data ?? [];
  const openRequestCount =
    openRequestsData?.meta?.total ?? openRequests.length;

  const { data: documentsData, isLoading: loadingDocuments } = useDocuments({
    page: 1,
    limit: 100,
  });
  const documents = documentsData?.data ?? [];
  const unsignedDocuments = documents.filter((d) => !d.isSigned).length;

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here is your portfolio overview.</p>
        </div>
        <Button onClick={() => navigate({ to: "/properties/new" })}>
          <Plus className="mr-2 h-4 w-4" /> Add Property
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.accent}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.sub && <p className="text-xs text-muted-foreground">{stat.sub}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400">Active Leases</CardTitle>
            <FileText className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            {loadingLeases ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-cyan-400">{activeLeaseCount}</div>
                <p className="text-xs text-muted-foreground">Currently generating revenue</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-success">Monthly Rental Income</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loadingLeases ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold text-success">
                  {money(monthlyRentalIncome)}
                </div>
                <p className="text-xs text-muted-foreground">Across {activeLeaseCount} active leases</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Overdue Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingOverdue ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
                <p className="text-xs text-muted-foreground">Payments past due</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Active RTO Contracts</CardTitle>
            <KeyRound className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingActiveRto ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">{activeRtoCount}</div>
                <p className="text-xs text-muted-foreground">Building equity toward ownership</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-success">Total Equity Accumulated</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loadingActiveRto ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold text-success">
                  {money(totalEquityAccumulated)}
                </div>
                <p className="text-xs text-muted-foreground">Across {activeRtoCount} active contracts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Defaulted RTO</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingDefaultedRto ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">{defaultedRtoCount}</div>
                <p className="text-xs text-muted-foreground">Contracts in default</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan-400 flex items-center gap-1">
              <Hammer className="h-4 w-4" /> Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-cyan-400">{activeProjects}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Projects by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-success">Completed</span>
                  <span className="font-semibold text-success">{completedProjects}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-cyan-400">In Progress</span>
                  <span className="font-semibold text-cyan-400">{activeProjects}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-warning">Planning</span>
                  <span className="font-semibold text-warning">{planningProjects}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-success">Turnover</span>
                  <span className="font-semibold text-success">{turnoverProjects}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Budget Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">On Budget: {greenBudgets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-xs text-muted-foreground">Warning: {yellowBudgets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">Over Budget: {redBudgets}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-border bg-card lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {revenueTrend && revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueTrend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                     <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                     <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `₱${(Number(v) / 1000).toFixed(0)}k`} />
                     <Tooltip
                       contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 13 }}
                       formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg border-border">
                  <EmptyState title="No revenue data yet" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Properties</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/properties" })}>
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(recentProperties?.data ?? []).length === 0 ? (
                  <EmptyState title="No properties yet" />
                ) : (
                  (recentProperties?.data ?? []).map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/30 rounded p-1 -mx-1 transition-colors"
                      onClick={() => navigate({ to: `/properties/${prop.id}` })}
                    >
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prop.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{prop.address}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {prop.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success flex items-center gap-1">
              <UserCheck className="h-4 w-4" /> Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-success">{totalAgents}</div>
                <p className="text-xs text-muted-foreground">{internalAgents} internal staff</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Active Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-success">{compliantAgents}</div>
                <p className="text-xs text-muted-foreground">License compliant</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary flex items-center gap-1">
              <BadgeDollarSign className="h-4 w-4" /> Unpaid Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAging ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">
                  {money(unpaidCommissions)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding aging total</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Receivable</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingAr ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">
                  {money(totalReceivable)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding AR across tenants</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Open Collection Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingCases ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">{openCasesCount}</div>
                <p className="text-xs text-muted-foreground">Active collection efforts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400">Quick Links</CardTitle>
            <BellRing className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/collections" })}>
              Collections
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/statements" })}>
              Statements
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-1">
              <Droplets className="h-4 w-4" /> Unpaid Utility Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUtilityBills ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-cyan-400">{unpaidUtilityBills}</div>
                <p className="text-xs text-muted-foreground">
                  {money(unpaidUtilityAmount)} outstanding
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive flex items-center gap-1">
              <Wrench className="h-4 w-4" /> Open Service Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">{openRequestCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting assignment</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-1">
              <FileText className="h-4 w-4" /> Unsigned Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDocuments ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-primary">{unsignedDocuments}</div>
                <p className="text-xs text-muted-foreground">Pending signatures</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

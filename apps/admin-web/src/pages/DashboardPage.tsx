import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, FileText, DollarSign, TrendingUp, Activity,
  Plus, ArrowRight, Hammer, CheckCircle2, Clock, AlertTriangle,
  Layers, KeyRound, UserCheck, ShieldCheck, BadgeDollarSign,
  Wallet, FolderOpen, BellRing, Droplets,
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
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

const stats = [
  { title: "Total Properties", value: "247", icon: Building2, change: "+12%", changeType: "up" },
  { title: "Active Tenants", value: "1,893", icon: Users, change: "+8%", changeType: "up" },
  { title: "Active Leases", value: "1,245", icon: FileText, change: "+5%", changeType: "up" },
  { title: "Monthly Revenue", value: "$847K", icon: DollarSign, change: "+14%", changeType: "up" },
  { title: "Avg. Occupancy", value: "94.2%", icon: TrendingUp, change: "+2.1%", changeType: "up" },
  { title: "Pending Requests", value: "38", icon: Activity, change: "-6%", changeType: "down" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
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
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const planningProjects = projects.filter((p) => p.status === "planning").length;
  const delayedProjects = projects.filter((p) => p.status === "delayed").length;
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
  const openCasesCount = (collectionCases ?? []).filter(
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

  return (
    <div className="space-y-6">
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
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.changeType === "up" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Active Leases</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loadingLeases ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-amber-700">{activeLeaseCount}</div>
                <p className="text-xs text-amber-600">Currently generating revenue</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Monthly Rental Income</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loadingLeases ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold text-emerald-700">
                  ${monthlyRentalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-emerald-600">Across {activeLeaseCount} active leases</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">Overdue Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loadingOverdue ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-rose-700">{overdueCount}</div>
                <p className="text-xs text-rose-600">Payments past due</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Active RTO Contracts</CardTitle>
            <KeyRound className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loadingActiveRto ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">{activeRtoCount}</div>
                <p className="text-xs text-amber-600">Building equity toward ownership</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Total Equity Accumulated</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loadingActiveRto ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold text-emerald-700">
                  ${totalEquityAccumulated.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-emerald-600">Across {activeRtoCount} active contracts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">Defaulted RTO</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loadingDefaultedRto ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-rose-700">{defaultedRtoCount}</div>
                <p className="text-xs text-rose-600">Contracts in default</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 flex items-center gap-1">
              <Hammer className="h-4 w-4" /> Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-700">{activeProjects}</div>
                <p className="text-xs text-blue-600">Currently in progress</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Projects by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-green-700">Completed</span>
                  <span className="font-semibold text-green-700">{completedProjects}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">In Progress</span>
                  <span className="font-semibold text-blue-700">{activeProjects}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-700">Planning</span>
                  <span className="font-semibold text-yellow-700">{planningProjects}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-700">Delayed</span>
                  <span className="font-semibold text-red-700">{delayedProjects}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Budget Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-xs text-purple-700">On Budget: {greenBudgets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-xs text-purple-700">Warning: {yellowBudgets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-xs text-purple-700">Over Budget: {redBudgets}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg border-muted-foreground/20">
              <p className="text-muted-foreground">Revenue chart will render here</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
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
                  <p className="text-sm text-muted-foreground text-center py-4">No properties yet.</p>
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
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">Available Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">24</div>
            <p className="text-xs text-green-600">Ready for lease or sale</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800">Rented Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">186</div>
            <p className="text-xs text-blue-600">Currently generating revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800">Sold Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">37</div>
            <p className="text-xs text-purple-600">Completed transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 flex items-center gap-1">
              <UserCheck className="h-4 w-4" /> Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-700">{totalAgents}</div>
                <p className="text-xs text-blue-600">{internalAgents} internal staff</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> Active Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAgents ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-emerald-700">{compliantAgents}</div>
                <p className="text-xs text-emerald-600">License compliant</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-800 flex items-center gap-1">
              <BadgeDollarSign className="h-4 w-4" /> Unpaid Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAging ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">
                  ${unpaidCommissions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-amber-600">Outstanding aging total</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Total Receivable</CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {loadingAr ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-3xl font-bold gold-text">
                  ${totalReceivable.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-amber-600">Outstanding AR across tenants</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-800">Open Collection Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            {loadingCases ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-rose-700">{openCasesCount}</div>
                <p className="text-xs text-rose-600">Active collection efforts</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Quick Links</CardTitle>
            <BellRing className="h-4 w-4 text-blue-600" />
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
        <Card className="bg-cyan-50 border-cyan-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-800 flex items-center gap-1">
              <Droplets className="h-4 w-4" /> Unpaid Utility Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUtilityBills ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-cyan-700">{unpaidUtilityBills}</div>
                <p className="text-xs text-cyan-600">
                  ${unpaidUtilityAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} outstanding
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

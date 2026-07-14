import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";

const portfolioStats = [
  { title: "Properties Owned", value: "12", icon: Building2, change: "+1", positive: true },
  { title: "Portfolio Value", value: "$24.8M", icon: DollarSign, change: "+$1.2M", positive: true },
  { title: "Total ROI", value: "14.2%", icon: TrendingUp, change: "+2.3%", positive: true },
  { title: "Monthly Income", value: "$184K", icon: PieChart, change: "+$12K", positive: true },
];

const projects = [
  { name: "Pine Valley Ranch", status: "in_progress", progress: 65, completion: "Dec 2026", roi: "18%" },
  { name: "Riverfront Plaza Expansion", status: "planning", progress: 10, completion: "Jun 2028", roi: "22%" },
  { name: "Oakwood Estates Phase 2", status: "completed", progress: 100, completion: "Mar 2026", roi: "15%" },
];

export default function OwnerDashboardPage() {
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
                <p className={`text-xs flex items-center gap-1 ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                  {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change} this quarter
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ROI by Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg border-muted-foreground/20">
              <p className="text-muted-foreground">ROI chart will render here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Completion Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <Badge
                    variant={
                      project.status === "completed" ? "success" :
                      project.status === "in_progress" ? "default" : "secondary"
                    }
                  >
                    {project.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${project.status === "completed" ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Est. completion: {project.completion}</span>
                  <span>Projected ROI: {project.roi}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

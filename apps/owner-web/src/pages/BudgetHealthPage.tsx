import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import { Separator } from "@elite-realty/shared-ui/components/ui";
import { ArrowLeft, DollarSign, AlertTriangle, TrendingDown, CheckCircle2 } from "lucide-react";
import { useBudgetHealth } from "@/hooks/use-budgets";

const healthColor = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
} as const;

const healthLabel = {
  green: "On Track",
  yellow: "Watch",
  red: "Overspent",
} as const;

export default function OwnerBudgetHealthPage() {
  const { projectId, budgetId } = useParams({ strict: false }) as { projectId: string; budgetId: string };
  const navigate = useNavigate();
  const { data: health, isLoading } = useBudgetHealth(budgetId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!health) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate({ to: `/projects/${projectId}` })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">Budget not found</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate({ to: `/projects/${projectId}` })}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Project
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{health.budgetName}</h1>
          <p className="text-muted-foreground">Budget Health & Variance Analysis</p>
        </div>
        <Badge variant={health.overallHealth === "green" ? "success" : health.overallHealth === "red" ? "destructive" : "warning"}>
          <span className="flex items-center gap-1">
            {health.overallHealth === "green" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : health.overallHealth === "red" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {healthLabel[health.overallHealth]}
          </span>
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Total Planned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${health.totalPlanned.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${health.totalActual.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${health.totalVariance < 0 ? "text-red-600" : "text-green-600"}`}>
              ${health.totalVariance.toLocaleString()} ({health.totalVariancePercent}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line items breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Line Item Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {health.items.map((item) => (
            <div key={item.lineItemId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium capitalize">{item.category.replace(/_/g, " ")}</p>
                  {item.subcategory && <p className="text-xs text-muted-foreground">{item.subcategory}</p>}
                  {item.vendorName && <p className="text-xs text-muted-foreground">{item.vendorName}</p>}
                </div>
                <div className={`h-3 w-3 rounded-full ${healthColor[item.health]}`} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                <div>
                  <span className="text-muted-foreground">Planned: </span>
                  <span className="font-medium">${item.plannedAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Actual: </span>
                  <span className="font-medium">${item.actualAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Variance: </span>
                  <span className={`font-medium ${item.variance < 0 ? "text-red-600" : "text-green-600"}`}>
                    ${item.variance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.health === "green" ? "bg-green-500" : item.health === "red" ? "bg-red-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(item.percentConsumed, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{item.percentConsumed}% consumed</p>
            </div>
          ))}
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground">
            Items highlighted in red are over 90% consumed or overspent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  X,
} from "lucide-react";
import { useBudget, useBudgetHealth, useCreateLineItem } from "@/hooks/use-budgets";
import { formatCurrency } from "@/lib/agent-meta";

function HealthBanner({ health }: { health: { healthScore: string; variancePercentage: number; totalPlanned: number; totalActual: number } }) {
  const isGreen = health.healthScore === "green";
  const isYellow = health.healthScore === "yellow";
  return (
    <div
      className={`rounded-lg border p-4 ${
        isGreen ? "bg-green-50 border-green-200" :
        isYellow ? "bg-yellow-50 border-yellow-200" :
        "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGreen ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : isYellow ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          )}
          <span className={`font-semibold ${
            isGreen ? "text-green-800" : isYellow ? "text-yellow-800" : "text-red-800"
          }`}>
            {isGreen ? "On Budget" : isYellow ? "Over Budget (Warning)" : "Over Budget (Critical)"}
          </span>
        </div>
        <span className={`text-lg font-bold ${
          isGreen ? "text-green-700" : isYellow ? "text-yellow-700" : "text-red-700"
        }`}>
          {health.variancePercentage >= 0 ? "+" : ""}{health.variancePercentage.toFixed(1)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <p className="text-sm text-muted-foreground">Planned</p>
          <p className="font-semibold">{formatCurrency(Number(health.totalPlanned))}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Actual</p>
          <p className="font-semibold">{formatCurrency(Number(health.totalActual))}</p>
        </div>
      </div>
    </div>
  );
}

export default function BudgetDetailPage() {
  const { budgetId } = useParams({ from: "/protected/projects/$projectId/budgets/$budgetId" });
  const navigate = useNavigate();
  const { data: budget, isLoading, isError } = useBudget(budgetId);
  const { data: health } = useBudgetHealth(budgetId);
  const createLineItem = useCreateLineItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category: "",
    subcategory: "",
    description: "",
    plannedAmount: "",
    actualAmount: "0",
    vendor: "",
    status: "pending",
  });

  const handleAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await createLineItem.mutateAsync({
      budgetId,
      category: newItem.category,
      subcategory: newItem.subcategory,
      description: newItem.description || undefined,
      plannedAmount: parseFloat(newItem.plannedAmount),
      actualAmount: parseFloat(newItem.actualAmount),
      vendor: newItem.vendor || undefined,
      status: newItem.status as any,
    });
    setDialogOpen(false);
    setNewItem({ category: "", subcategory: "", description: "", plannedAmount: "", actualAmount: "0", vendor: "", status: "pending" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !budget) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Budget not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lineItems = health?.plannedVsActual ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
            <Badge variant={
              budget.status === "approved" ? "success" :
              budget.status === "active" ? "default" : "secondary"
            }>
              {budget.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">Version {budget.version} &middot; {formatCurrency(Number(budget.totalPlanned))} total planned</p>
        </div>
      </div>

      {health && <HealthBanner health={health} />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Planned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatCurrency(Number(health?.totalPlanned ?? budget.totalPlanned))}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatCurrency(Number(health?.totalActual ?? budget.totalActual))}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health && health.variance >= 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
              <span className={`text-2xl font-bold ${health && health.variance > 0 ? "text-red-600" : "text-green-600"}`}>
                 {health ? formatCurrency(Number(Math.abs(health.variance))) : "0"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" /> Add Line Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Line Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddLineItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={newItem.category} onValueChange={(v) => setNewItem((p) => ({ ...p, category: v }))} required>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="permits">Permits & Fees</SelectItem>
                        <SelectItem value="subcontractors">Subcontractors</SelectItem>
                        <SelectItem value="contingency">Contingency</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subcategory *</Label>
                    <Input value={newItem.subcategory} onChange={(e) => setNewItem((p) => ({ ...p, subcategory: e.target.value }))} required placeholder="e.g. Concrete, Framing" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={newItem.description} onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Planned Amount *</Label>
                      <Input type="number" min="0" step="0.01" value={newItem.plannedAmount} onChange={(e) => setNewItem((p) => ({ ...p, plannedAmount: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Actual Amount</Label>
                      <Input type="number" min="0" step="0.01" value={newItem.actualAmount} onChange={(e) => setNewItem((p) => ({ ...p, actualAmount: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Input value={newItem.vendor} onChange={(e) => setNewItem((p) => ({ ...p, vendor: e.target.value }))} placeholder="Vendor name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newItem.status} onValueChange={(v) => setNewItem((p) => ({ ...p, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createLineItem.isPending}>
                      {createLineItem.isPending ? "Adding..." : "Add Item"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="py-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No line items yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first budget line item.</p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Subcategory</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Planned</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actual</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Variance</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">% Consumed</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vendor</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => {
                    const variance = item.actual - item.planned;
                    const pct = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                    return (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium">{item.category}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.category}</td>
                         <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(item.planned))}</td>
                         <td className="px-4 py-3 text-sm text-right">{formatCurrency(Number(item.actual))}</td>
                         <td className={`px-4 py-3 text-sm text-right ${variance > 0 ? "text-red-600" : "text-green-600"}`}>
                           {variance >= 0 ? "+" : ""}{formatCurrency(Number(variance))}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-medium ${pct > 100 ? "text-red-600" : pct > 80 ? "text-yellow-600" : "text-green-600"}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
                        <td className="px-4 py-3 text-center">
                          <div className={`inline-flex h-2.5 w-2.5 rounded-full ${
                            pct <= 100 ? "bg-green-500" : pct <= 120 ? "bg-yellow-500" : "bg-red-500"
                          }`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


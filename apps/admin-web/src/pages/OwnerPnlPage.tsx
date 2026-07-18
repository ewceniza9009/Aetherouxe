import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  PieChart,
  Loader2,
} from "lucide-react";
import {
  usePnlStatements,
  useGeneratePnl,
  type OwnerPnlStatement,
} from "@/hooks/use-owner-pnl";
import { formatCurrency } from "@/lib/agent-meta";

const pnlStatusMeta: Record<string, { label: string; variant: any }> = {
  draft: { label: "Draft", variant: "secondary" },
  issued: { label: "Issued", variant: "default" },
};

const PNL_STATUS_FALLBACK = { label: "Unknown", variant: "secondary" };

function money(n: number) {
  return formatCurrency(Number(n ?? 0));
}

export default function OwnerPnlPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, query, sortHeader, sortIndicator } = listQuery;

  const { data, isLoading, isError, refetch } = usePnlStatements(query);
  const generatePnl = useGeneratePnl();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ownerId: "",
    ownerName: "",
    propertyId: "",
    propertyName: "",
    periodStart: "",
    periodEnd: "",
    managementFeeRate: "0.10",
  });

  const statements = data?.data ?? [];
  const meta = data?.meta;

  const handleGenerate = async () => {
    setSaving(true);
    try {
      const result = await generatePnl.mutateAsync({
        ownerId: form.ownerId,
        propertyId: form.propertyId || undefined,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        managementFeeRate: Number(form.managementFeeRate),
      });
      setOpen(false);
      setForm({
        ownerId: "",
        ownerName: "",
        propertyId: "",
        propertyName: "",
        periodStart: "",
        periodEnd: "",
        managementFeeRate: "0.10",
      });
      refetch();
      if (result?.id) navigate({ to: `/owner-pnl/${result.id}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Owner P&amp;L</h1>
          <p className="text-muted-foreground">Profit &amp; loss statements for owners</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={generatePnl.isPending}>
          <Plus className="mr-2 h-4 w-4" /> Generate Statement
        </Button>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search statements…"
        action={{ label: "Generate Statement", onClick: () => setOpen(true) }}
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={statements.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Property
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Period
                    </th>
                    <th {...sortHeader("grossRentalIncome", "px-4 py-3 text-right text-sm font-medium text-muted-foreground")}>
                      Gross{sortIndicator("grossRentalIncome")}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Expenses
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Fee
                    </th>
                    <th {...sortHeader("netIncome", "px-4 py-3 text-right text-sm font-medium text-muted-foreground")}>
                      Net{sortIndicator("netIncome")}
                    </th>
                    <th {...sortHeader("status", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((s: OwnerPnlStatement) => (
                    <tr
                      key={s.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate({ to: `/owner-pnl/${s.id}` })}
                    >
                      <td className="px-4 py-3 font-medium">
                        {s.ownerName || s.ownerId.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {s.propertyName || s.propertyId?.slice(0, 8).toUpperCase() || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(s.periodStart).toLocaleDateString()} –{" "}
                        {new Date(s.periodEnd).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {money(s.grossRentalIncome)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {money(s.totalExpenses)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {money(s.managementFee)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold gold-text">
                        {money(s.netIncome)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(pnlStatusMeta[s.status] ?? PNL_STATUS_FALLBACK).variant}>
                          {(pnlStatusMeta[s.status] ?? PNL_STATUS_FALLBACK).label}
                        </Badge>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Statement</DialogTitle>
            <DialogDescription>
              Produce an owner P&amp;L for a period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownerId">Owner ID *</Label>
                <Input
                  id="ownerId"
                  value={form.ownerId}
                  onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
                  placeholder="Owner reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={form.ownerName}
                  onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                  placeholder="Display name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyId">Property ID (optional)</Label>
              <Input
                id="propertyId"
                value={form.propertyId}
                onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                placeholder="Property reference"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={form.periodStart}
                  onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="managementFeeRate">Management Fee Rate</Label>
              <Input
                id="managementFeeRate"
                type="number"
                min="0"
                step="0.01"
                value={form.managementFeeRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, managementFeeRate: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={saving || !form.ownerId || !form.periodStart || !form.periodEnd}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

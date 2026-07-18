import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, ClipboardList, Lock, Unlock, FileCode } from "lucide-react";
import { useSchemes, useDeleteScheme, SCHEME_TYPES, type Scheme } from "@/hooks/use-schemes";

const schemeTypeMeta: Record<string, { label: string; className: string }> = {
  standard_rental: { label: "Rental", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  spot_cash: { label: "Spot Cash", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  installment: { label: "Installment", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  mortgage_assisted: { label: "Mortgage", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  rent_to_own: { label: "RTO", className: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

function schemeSummary(s: Scheme): string {
  switch (s.schemeType) {
    case "installment":
      return `${s.eqNumberOfPayments ?? 0} EQ / ${s.blNumberOfPayments ?? 0} BL · ${s.eqPaymentPercentage ?? 0}% EQ`;
    case "mortgage_assisted":
      return `${s.mortgageDownPaymentPercent ?? 0}% DP · ${s.interestRatePercent ?? 0}% · ${s.loanTermMonths ?? 0}mo`;
    case "rent_to_own":
      return `${s.optionFeePercent ?? 0}% option · ${s.equityAccumulationPercent ?? 0}% equity · ${s.targetPurchaseYears ?? 0}yr`;
    case "standard_rental":
      return `${s.securityDepositPercent ?? 0}% deposit · ${s.graceDays ?? 0}grace`;
    case "spot_cash":
      return `${s.discountPercent ?? 0}% discount`;
    default:
      return "—";
  }
}

export default function SchemesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: schemes, isLoading } = useSchemes(typeFilter === "all" ? undefined : typeFilter);
  const deleteScheme = useDeleteScheme();

  const filtered = (schemes ?? []).filter(
    (s) =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schemes</h1>
          <p className="text-muted-foreground">Payment plan templates for all transaction types</p>
        </div>
        <Button onClick={() => navigate({ to: "/schemes/$id", params: { id: "new" } })}>
          <Plus className="mr-2 h-4 w-4" /> New Scheme
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search schemes..." className="pl-9 bg-transparent" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {SCHEME_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No schemes found.</p>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/schemes/$id", params: { id: "new" } })}>
                <Plus className="mr-2 h-4 w-4" /> Create a Scheme
              </Button>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Terms</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Agent %</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Company %</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const meta = schemeTypeMeta[s.schemeType] ?? { label: s.schemeType, className: "" };
                    return (
                      <tr
                        key={s.id}
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate({ to: `/schemes/${s.id}` })}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <FileCode className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-mono text-xs font-medium">{s.code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{s.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{schemeSummary(s)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{s.agentCommissionPercentage ?? "—"}%</td>
                        <td className="px-4 py-3 text-right tabular-nums">{s.companyCommissionPercentage ?? "—"}%</td>
                        <td className="px-4 py-3 text-center">
                          {s.isLocked ? (
                            <Lock className="h-4 w-4 text-amber-500 mx-auto" />
                          ) : (
                            <Unlock className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
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

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Lock, Unlock, FileCode } from "lucide-react";
import { useSchemes, SCHEME_TYPES, type Scheme } from "@/hooks/use-schemes";
import { ListPager } from "@/components/ListPager";

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
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fullQuery = useMemo(
    () => ({
      ...query,
      type: typeFilter !== "all" ? typeFilter : undefined,
    }),
    [query, typeFilter]
  );

  const { data: schemesResult, isLoading, isError } = useSchemes(fullQuery);

  const schemes = schemesResult?.data ?? [];
  const meta = schemesResult?.meta;

  return (
    <div className="space-y-6 flex flex-col ">
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
          <GridToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search schemes..."
            filters={
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
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
            }
          />

          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={schemes.length === 0}
            onRetry={() => {}}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("code", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Code{sortIndicator("code")}
                    </th>
                    <th {...sortHeader("name", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Name{sortIndicator("name")}
                    </th>
                    <th {...sortHeader("schemeType", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Type{sortIndicator("schemeType")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Terms</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Agent %</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Company %</th>
                    <th {...sortHeader("isLocked", "px-4 py-3 text-center text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("isLocked")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map((s) => {
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
            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

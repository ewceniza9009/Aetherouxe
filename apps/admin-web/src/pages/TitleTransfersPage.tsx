import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollText, CheckCircle2 } from "lucide-react";
import {
  useTitleTransfers,
  useCompleteTitleTransfer,
  titleTransferStatusLabels,
  titleTransferBasisLabels,
  type TitleTransfer,
  type TitleTransferStatus,
} from "@/hooks/use-titles";

const statusVariant: Record<TitleTransferStatus, "default" | "secondary" | "success" | "warning"> = {
  pending: "secondary",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
};

function partyName(p?: TitleTransfer["buyer"]): string {
  if (!p) return "—";
  const name = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return name || p.email;
}

function money(v?: string | null): string {
  if (v == null) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n);
}

const statusOptions = Object.keys(titleTransferStatusLabels) as TitleTransferStatus[];

export default function TitleTransfersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const query = useMemo(
    () => ({ status: statusFilter !== "all" ? (statusFilter as TitleTransferStatus) : undefined }),
    [statusFilter]
  );
  const { data, isLoading, isError } = useTitleTransfers(query);
  const complete = useCompleteTitleTransfer();
  const transfers = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Title Transfers</h1>
          <p className="text-muted-foreground">
            Track ownership handover from developer/landlord to buyers
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>All Transfers</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {titleTransferStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-12 text-center text-destructive">
              <p className="font-semibold">Failed to load title transfers</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-medium">No title transfers yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Transfers appear once a buyer's payment (spot cash, installment, RTO or mortgage) is settled.
              </p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm font-medium text-muted-foreground">
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Basis</th>
                    <th className="px-4 py-3">Title No.</th>
                    <th className="px-4 py-3">Contract Value</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-xs">
                        {t.property?.propertyCode ?? "—"}
                        {t.unit?.unitNumber ? ` / ${t.unit.unitNumber}` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {t.property?.project?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{partyName(t.buyer)}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="secondary">{titleTransferBasisLabels[t.basis]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{t.titleNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-sm">{money(t.contractValue)}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant={statusVariant[t.status]}>
                          {titleTransferStatusLabels[t.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(t.requestedDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {t.status !== "completed" && t.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => complete.mutate(t.id)}
                            disabled={complete.isPending}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

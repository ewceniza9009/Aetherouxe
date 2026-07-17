import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FolderOpen, AlertTriangle } from "lucide-react";
import {
  useCollectionCases,
  CASE_STATUS_VARIANT,
  CASE_STATUS_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_PRIORITY_LABELS,
  type CollectionCaseStatus,
  type CollectionCasePriority,
  formatCurrency,
  formatDate,
} from "@/hooks/use-collections";

export default function CollectionCasesPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data, isLoading, isError } = useCollectionCases();

  const cases = useMemo(() => {
    const all = data ?? [];
    return all.filter((c) => {
      const statusOk =
        statusFilter === "all" || c.status === (statusFilter as CollectionCaseStatus);
      const priorityOk =
        priorityFilter === "all" ||
        c.priority === (priorityFilter as CollectionCasePriority);
      return statusOk && priorityOk;
    });
  }, [data, statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Collection Cases</h1>
          <p className="text-muted-foreground">Track and manage delinquent accounts</p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/collections" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Collections
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-accent" /> Cases
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              Failed to load collection cases.
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No collection cases found.</p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Lease</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Next Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: `/collections/cases/${c.id}` })}
                    >
                      <TableCell className="font-mono text-sm">
                        {c.caseNumber ? `#${c.caseNumber}` : `#${c.id.slice(0, 8).toUpperCase()}`}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.tenant?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.lease && typeof c.lease === "object" && "leaseNumber" in c.lease
                          ? (c.lease as { leaseNumber?: string }).leaseNumber ?? "—"
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={CASE_PRIORITY_VARIANT[c.priority]}>
                          {CASE_PRIORITY_LABELS[c.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={CASE_STATUS_VARIANT[c.status]}>
                          {CASE_STATUS_LABELS[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">
                        {formatCurrency(Number(c.totalOutstanding ?? 0))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.assignedTo
                          ? `${c.assignedTo.firstName ?? ""} ${c.assignedTo.lastName ?? ""}`.trim() || "—"
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.nextActionDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

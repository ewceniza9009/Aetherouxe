import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { FileText, Plus, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import {
  useStatements,
  useCreateStatement,
  useGenerateStatement,
  STATEMENT_STATUS_VARIANT,
  STATEMENT_STATUS_LABELS,
  formatCurrency,
  formatDate,
  type Statement,
} from "@/hooks/use-collections";
import { useUsers } from "@/hooks/use-users";

function getTenantId(): string | undefined {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return undefined;
    const parsed = JSON.parse(stored) as { tenantId?: string };
    return parsed.tenantId || undefined;
  } catch {
    return undefined;
  }
}

function recipientName(s: Statement): string {
  if (s.owner) {
    const name = `${s.owner.firstName ?? ""} ${s.owner.lastName ?? ""}`.trim();
    if (name) return name;
    if (s.owner.email) return s.owner.email;
  }
  return "—";
}

function formatPeriodRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "—";
  const fmt = (v?: string | null) => {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString(undefined, opts);
  };
  if (start && end) return `${fmt(start)} \u2013 ${fmt(end)}`;
  return fmt(start) ?? fmt(end) ?? "—";
}

export default function StatementsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useStatements();
  const createStatement = useCreateStatement();
  const generateStatement = useGenerateStatement();
  const { data: ownersData } = useUsers({ userType: "owner" });

  const [open, setOpen] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [billed, setBilled] = useState("");
  const [paid, setPaid] = useState("0");

  const statements = data ?? [];
  const owners = ownersData?.data ?? [];

  const resetForm = () => {
    setOwnerId("");
    setPeriodStart("");
    setPeriodEnd("");
    setOpeningBalance("0");
    setBilled("");
    setPaid("0");
  };

  const submit = async () => {
    const totalBilled = Number(billed) || 0;
    const totalPaid = Number(paid) || 0;
    if (!ownerId || !periodStart || !periodEnd || !billed) return;
    await createStatement.mutateAsync({
      ownerId,
      tenantId: getTenantId(),
      periodStart,
      periodEnd,
      openingBalance: Number(openingBalance) || 0,
      totalBilled,
      totalPaid,
    });
    setOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Statements</h1>
          <p className="text-muted-foreground">Generated tenant and owner statements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/collections" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Collections
          </Button>
          <Button
            variant="outline"
            onClick={() => generateStatement.mutate({ tenantId: getTenantId(), period: "" })}
            disabled={generateStatement.isPending}
          >
            {generateStatement.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate for Organization
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Statement
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" /> All Statements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              Failed to load statements.
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : statements.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No statements yet.</p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Billed</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Closing</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{recipientName(s)}</div>
                        {s.tenant?.name && (
                          <div className="text-xs text-muted-foreground">
                            {s.tenant.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPeriodRange(s.periodStart, s.periodEnd)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(Number(s.totalBilled ?? 0))}
                      </TableCell>
                      <TableCell className="tabular-nums text-green-700">
                        {formatCurrency(Number(s.totalPaid ?? 0))}
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">
                        {formatCurrency(Number(s.closingBalance ?? 0))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATEMENT_STATUS_VARIANT[s.status]}>
                          {STATEMENT_STATUS_LABELS[s.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Statement</DialogTitle>
            <DialogDescription>
              Create a statement for an owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Recipient (Owner)</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger id="owner">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {`${o.firstName ?? ""} ${o.lastName ?? ""}`.trim() || o.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening">Opening Balance</Label>
                <Input
                  id="opening"
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billed">Billed Amount</Label>
                <Input
                  id="billed"
                  type="number"
                  value={billed}
                  onChange={(e) => setBilled(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid">Paid Amount</Label>
                <Input
                  id="paid"
                  type="number"
                  value={paid}
                  onChange={(e) => setPaid(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                createStatement.isPending ||
                !ownerId ||
                !periodStart ||
                !periodEnd ||
                !billed
              }
            >
              {createStatement.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Statement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

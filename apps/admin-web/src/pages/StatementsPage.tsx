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
} from "@/hooks/use-collections";

export default function StatementsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useStatements();
  const createStatement = useCreateStatement();
  const generateStatement = useGenerateStatement();

  const [open, setOpen] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [period, setPeriod] = useState("");
  const [billed, setBilled] = useState("");
  const [paid, setPaid] = useState("0");

  const statements = data ?? [];

  const resetForm = () => {
    setOwnerName("");
    setTenantId("");
    setPropertyName("");
    setPeriod("");
    setBilled("");
    setPaid("0");
  };

  const submit = async () => {
    if (!ownerName || !period || !billed) return;
    const billedAmount = Number(billed) || 0;
    const paidAmount = Number(paid) || 0;
    await createStatement.mutateAsync({
      ownerName,
      tenantId: tenantId || "—",
      propertyName: propertyName || undefined,
      period,
      billedAmount,
      paidAmount,
      closingBalance: billedAmount - paidAmount,
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
            onClick={() => generateStatement.mutate({ tenantId: "", period: "" })}
            disabled={generateStatement.isPending}
          >
            {generateStatement.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate for Tenant
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
            <div className="rounded-md border overflow-x-auto">
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
                        <div className="font-medium">{s.ownerName}</div>
                        {s.propertyName && (
                          <div className="text-xs text-muted-foreground">
                            {s.propertyName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{s.period}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(s.billedAmount)}
                      </TableCell>
                      <TableCell className="tabular-nums text-green-700">
                        {formatCurrency(s.paidAmount)}
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold">
                        {formatCurrency(s.closingBalance)}
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
              Create a statement for a tenant or owner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Recipient Name</Label>
              <Input
                id="owner"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant ID</Label>
                <Input
                  id="tenantId"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="tenant uuid"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <Input
                  id="property"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Property code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Input
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2026-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              disabled={createStatement.isPending || !ownerName || !period || !billed}
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

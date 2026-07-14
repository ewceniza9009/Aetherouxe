import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import * as Tabs from "@radix-ui/react-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  Phone,
  Plus,
  CheckCircle2,
  DollarSign,
  Wallet,
  Home,
  KeyRound,
  FileBadge,
  ShieldAlert,
} from "lucide-react";
import {
  useAgent,
  useAgentPerformance,
  useAgentLicenseRenewals,
  useCreateLicenseRenewal,
  type LicenseStatus,
} from "@/hooks/use-agents";
import {
  useAgentTransactions,
  useCommissionReleases,
  useApproveTransaction,
} from "@/hooks/use-commissions";
import {
  TIER_LABELS,
  tierBadgeVariant,
  licenseStatusVariant,
  licenseDotColor,
  AGENT_STATUS_LABELS,
  agentStatusVariant,
  TRANSACTION_STATUS_LABELS,
  transactionStatusVariant,
  TRANSACTION_TYPE_LABELS,
  RELEASE_TYPE_LABELS,
  formatCurrency,
  formatDate,
  getInitials,
} from "@/lib/agent-meta";

export default function AgentDetailPage() {
  const { id } = useParams({ from: "/agents/$id" });
  const navigate = useNavigate();
  const { data: agent, isLoading, isError } = useAgent(id);
  const { data: performance } = useAgentPerformance(id);
  const { data: transactions } = useAgentTransactions({ agentId: id, limit: 100 });
  const { data: releases } = useCommissionReleases({ agentId: id });
  const { data: renewals } = useAgentLicenseRenewals(id);
  const approve = useApproveTransaction();
  const createRenewal = useCreateLicenseRenewal(id);

  const [renewalDialog, setRenewalDialog] = useState(false);
  const [renewalForm, setRenewalForm] = useState({
    licenseNumber: agent?.licenseNumber ?? "",
    renewalDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    cpeUnits: 0,
    cpeRequired: 24,
    status: "compliant" as LicenseStatus,
    reference: "",
    notes: "",
  });

  const handleAddRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRenewal.mutateAsync({
      licenseNumber: renewalForm.licenseNumber || undefined,
      renewalDate: renewalForm.renewalDate,
      expiryDate: renewalForm.expiryDate,
      cpeUnits: Number(renewalForm.cpeUnits),
      cpeRequired: renewalForm.cpeRequired || undefined,
      status: renewalForm.status,
      reference: renewalForm.reference || undefined,
      notes: renewalForm.notes || undefined,
    });
    setRenewalDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/agents" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Agent not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const txList = transactions?.data ?? [];
  const releaseList = releases ?? [];
  const renewalList = renewals ?? [];

  const summaryCards = [
    {
      title: "Total Sales Volume",
      value: formatCurrency(performance?.totalSalesVolume),
      icon: Home,
      tone: "text-primary",
    },
    {
      title: "Commission Earned",
      value: formatCurrency(performance?.commissionEarned),
      icon: DollarSign,
      tone: "text-emerald-500",
    },
    {
      title: "Commission Paid",
      value: formatCurrency(performance?.commissionPaid),
      icon: Wallet,
      tone: "text-teal-500",
    },
    {
      title: "Properties Sold / Leased",
      value: `${(performance?.propertiesSold ?? 0)} / ${(performance?.propertiesLeased ?? 0)}`,
      icon: KeyRound,
      tone: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/agents" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-1 items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-muted text-base">
              {getInitials(agent.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
              <Badge variant={tierBadgeVariant(agent.tier)}>
                {TIER_LABELS[agent.tier]}
              </Badge>
              <Badge variant={agent.isInternal ? "outline" : "secondary"} className={agent.isInternal ? "border-primary/40 text-primary" : ""}>
                {agent.isInternal ? "Internal" : "External"}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {agent.email}
              </span>
              {agent.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {agent.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${licenseDotColor(agent.licenseStatus)}`}
                />
                License {agent.licenseStatus}
              </span>
              <Badge variant={agentStatusVariant(agent.status)}>
                {AGENT_STATUS_LABELS[agent.status]}
              </Badge>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate({ to: `/agents/${agent.id}/edit` })}>
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.tone}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs.Root defaultValue="transactions" className="space-y-4">
        <Tabs.List className="flex gap-1 border-b border-border">
          <Tabs.Trigger
            value="transactions"
            className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            Transactions
          </Tabs.Trigger>
          <Tabs.Trigger
            value="releases"
            className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            Releases
          </Tabs.Trigger>
          <Tabs.Trigger
            value="license"
            className="px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
          >
            License
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agent Transactions</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {txList.length} total
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {txList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No transactions recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txList.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant="secondary">
                            {TRANSACTION_TYPE_LABELS[tx.type] ?? tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.propertyName ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.clientName ?? "—"}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="tabular-nums text-primary">
                          {formatCurrency(tx.commissionAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.transactionDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transactionStatusVariant(tx.status)}>
                            {TRANSACTION_STATUS_LABELS[tx.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tx.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={approve.isPending}
                              onClick={() => approve.mutate(tx.id)}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="releases">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Commission Releases</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {releaseList.length} total
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {releaseList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No commission releases recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releaseList.map((rel) => (
                      <TableRow key={rel.id}>
                        <TableCell className="font-semibold tabular-nums text-emerald-500">
                          {formatCurrency(rel.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(rel.releaseDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {RELEASE_TYPE_LABELS[rel.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {rel.reference ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="license">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>License Renewals</CardTitle>
                <Dialog open={renewalDialog} onOpenChange={setRenewalDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Renewal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add License Renewal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddRenewal} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="r-license">License Number</Label>
                        <Input
                          id="r-license"
                          value={renewalForm.licenseNumber}
                          onChange={(e) =>
                            setRenewalForm((p) => ({ ...p, licenseNumber: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="r-renewal">Renewal Date</Label>
                          <Input
                            id="r-renewal"
                            type="date"
                            value={renewalForm.renewalDate}
                            onChange={(e) =>
                              setRenewalForm((p) => ({ ...p, renewalDate: e.target.value }))
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="r-expiry">Expiry Date</Label>
                          <Input
                            id="r-expiry"
                            type="date"
                            value={renewalForm.expiryDate}
                            onChange={(e) =>
                              setRenewalForm((p) => ({ ...p, expiryDate: e.target.value }))
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="r-cpe">CPE Units</Label>
                          <Input
                            id="r-cpe"
                            type="number"
                            min="0"
                            value={renewalForm.cpeUnits}
                            onChange={(e) =>
                              setRenewalForm((p) => ({
                                ...p,
                                cpeUnits: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="r-cpe-req">CPE Required</Label>
                          <Input
                            id="r-cpe-req"
                            type="number"
                            min="0"
                            value={renewalForm.cpeRequired}
                            onChange={(e) =>
                              setRenewalForm((p) => ({
                                ...p,
                                cpeRequired: Number(e.target.value),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={renewalForm.status}
                          onValueChange={(v) =>
                            setRenewalForm((p) => ({ ...p, status: v as LicenseStatus }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compliant">Compliant</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="r-ref">Reference</Label>
                        <Input
                          id="r-ref"
                          value={renewalForm.reference}
                          onChange={(e) =>
                            setRenewalForm((p) => ({ ...p, reference: e.target.value }))
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setRenewalDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createRenewal.isPending}>
                          {createRenewal.isPending ? "Saving..." : "Save Renewal"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {renewalList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <FileBadge className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                  No license renewals on file.
                </div>
              ) : (
                <div className="space-y-3">
                  {renewalList.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        {r.status === "expired" || r.status === "suspended" ? (
                          <ShieldAlert className="h-5 w-5 text-red-500" />
                        ) : (
                          <FileBadge className="h-5 w-5 text-emerald-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {r.licenseNumber ?? "License"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Renewed {formatDate(r.renewalDate)} · Expires{" "}
                            {formatDate(r.expiryDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="text-sm">
                          <p className="text-muted-foreground">CPE</p>
                          <p className="font-medium tabular-nums">
                            {r.cpeUnits}
                            {r.cpeRequired ? ` / ${r.cpeRequired}` : ""}
                          </p>
                        </div>
                        <Badge variant={licenseStatusVariant(r.status)}>
                          {r.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

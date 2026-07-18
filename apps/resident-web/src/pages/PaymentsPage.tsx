import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@elite-realty/shared-ui/components/ui";
import { CreditCard, Download, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useMyLease, useLeasePayments, useRecordPayment, type PaymentMethod } from "@/hooks/use-leases";

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { data: lease } = useMyLease();
  const { data: payments, isLoading, refetch } = useLeasePayments(lease?.id ?? "");
  const recordPayment = useRecordPayment();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const list = payments ?? [];
  const unpaid = list
    .filter((p) => p.status !== "paid")
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
  const nextDue = unpaid[0];

  const handlePayNow = async () => {
    if (!nextDue) return;
    await recordPayment.mutateAsync({
      id: nextDue.id,
      amount: nextDue.amount,
      method: "card" as PaymentMethod,
      paidDate: new Date().toISOString(),
    });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Pay rent and view payment history</p>
      </div>

      <Tabs defaultValue="pay">
        <TabsList>
          <TabsTrigger value="pay">Make a Payment</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="pay">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !nextDue ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                <p className="mt-3 font-semibold">All payments are up to date</p>
                <p className="text-sm text-muted-foreground">You have no outstanding balance.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Balance Due</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-4xl font-bold text-primary">
                    ${nextDue.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {nextDue.period ?? "Payment"} · Due {nextDue.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : "—"}
                  </p>
                  {nextDue.dueDate && new Date(nextDue.dueDate) < new Date() && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Overdue</span>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={handlePayNow}
                    disabled={recordPayment.isPending}
                  >
                    {recordPayment.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Pay ${nextDue.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card">Card Number</Label>
                    <Input
                      id="card"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handlePayNow} disabled={recordPayment.isPending}>
                    {recordPayment.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Pay Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : list.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No payment records yet.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Due Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Paid Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((inv) => (
                        <tr key={inv.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{inv.period ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-sm">{inv.method.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-sm">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 text-sm">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={inv.status === "paid" ? "success" : inv.status === "failed" ? "destructive" : "warning"}>
                              {inv.status === "paid" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {inv.status === "paid" && (
                              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                                <Download className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}



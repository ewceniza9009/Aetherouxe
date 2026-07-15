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
  Building2,
  Mail,
  Phone,
  Award,
  DollarSign,
  Calendar,
  Plus,
  FileText,
} from "lucide-react";
import {
  useContractor,
  useEngagements,
  useCreatePayment,
} from "@/hooks/use-contractors";

export default function ContractorDetailPage() {
  const { id } = useParams({ from: "/protected/contractors/$id" });
  const navigate = useNavigate();
  const { data: contractor, isLoading, isError } = useContractor(id);
  const { data: engagements } = useEngagements({ contractorId: id });
  const createPayment = useCreatePayment();

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState("");
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "bank_transfer",
    reference: "",
    notes: "",
  });
  const [expandedEngagement, setExpandedEngagement] = useState<string | null>(null);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngagement) return;
    await createPayment.mutateAsync({
      engagementId: selectedEngagement,
      amount: parseFloat(paymentForm.amount),
      paymentDate: paymentForm.paymentDate,
      method: paymentForm.method,
      reference: paymentForm.reference || undefined,
      notes: paymentForm.notes || undefined,
    });
    setPaymentDialog(false);
    setPaymentForm({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      method: "bank_transfer",
      reference: "",
      notes: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !contractor) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/contractors" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Contractor not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/contractors" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{contractor.companyName}</h1>
            <Badge variant={
              contractor.status === "active" ? "success" :
              contractor.status === "suspended" ? "destructive" : "secondary"
            }>
              {contractor.status}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contractor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-4 w-4" /> Company
              </p>
              <p className="font-medium mt-1">{contractor.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" /> Email
              </p>
              <p className="font-medium mt-1">{contractor.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-4 w-4" /> Phone
              </p>
              <p className="font-medium mt-1">{contractor.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Award className="h-4 w-4" /> License
              </p>
              <p className="font-medium mt-1">{contractor.licenseNumber || "—"}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Specialization</p>
            <Badge variant="secondary" className="mt-1">{contractor.specialization}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Engagements</h2>
        <span className="text-sm text-muted-foreground">{engagements?.length ?? 0} total</span>
      </div>

      {!engagements || engagements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No engagements</p>
            <p className="text-sm text-muted-foreground mt-1">This contractor has no project engagements yet.</p>
          </CardContent>
        </Card>
      ) : (
        engagements.map((eng) => (
          <Card key={eng.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{eng.projectName || `Project ${eng.projectId}`}</h3>
                  {eng.scope && <p className="text-sm text-muted-foreground mt-1">{eng.scope}</p>}
                </div>
                <Badge variant={
                  eng.status === "active" ? "default" :
                  eng.status === "completed" ? "success" :
                  eng.status === "terminated" ? "destructive" : "secondary"
                }>
                  {eng.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Amount</p>
                  <p className="font-semibold">${eng.contractAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="font-semibold">${eng.paidAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-semibold">${(eng.contractAmount - eng.paidAmount).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    eng.status === "completed" ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ width: `${eng.contractAmount > 0 ? (eng.paidAmount / eng.contractAmount) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-end mt-4">
                <Dialog open={paymentDialog && selectedEngagement === eng.id} onOpenChange={(open) => {
                  setPaymentDialog(open);
                  if (open) setSelectedEngagement(eng.id);
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Add Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddPayment} className="space-y-4">
                      <input type="hidden" value={selectedEngagement} />
                      <div className="space-y-2">
                        <Label>Engagement</Label>
                        <p className="text-sm font-medium">{eng.projectName || `Project ${eng.projectId}`}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <Input id="amount" type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentDate">Payment Date</Label>
                        <Input id="paymentDate" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((p) => ({ ...p, method: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reference">Reference</Label>
                        <Input id="reference" value={paymentForm.reference} onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))} placeholder="Check #, invoice #, etc." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input id="notes" value={paymentForm.notes} onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))} />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" type="button" onClick={() => setPaymentDialog(false)}>Cancel</Button>
                        <Button type="submit" disabled={createPayment.isPending}>
                          {createPayment.isPending ? "Adding..." : "Add Payment"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

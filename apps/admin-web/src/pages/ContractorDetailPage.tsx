import { useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Skeleton } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
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
  useUpdateContractor,
  useCreateEngagement,
  useDeleteContractor,
} from "@/hooks/use-contractors";
import { formatCurrency } from "@/lib/agent-meta";

export default function ContractorDetailPage() {
  const { id } = useParams({ from: "/protected/contractors/$id" });
  const navigate = useNavigate();
  const { data: contractor, isLoading, isError } = useContractor(id);
  const { data: engagements } = useEngagements({ contractorId: id });
  const updateContractor = useUpdateContractor();
  const createEngagement = useCreateEngagement();
  const createPayment = useCreatePayment();
  const deleteContractor = useDeleteContractor();

  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedEngagement, setSelectedEngagement] = useState("");
  const [deleteContractorDialog, setDeleteContractorDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "bank_transfer",
    reference: "",
    notes: "",
  });

  const [editContractorDialog, setEditContractorDialog] = useState(false);
  const [editContractorForm, setEditContractorForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
  });

  const [newEngagementDialog, setNewEngagementDialog] = useState(false);
  const [newEngagementForm, setNewEngagementForm] = useState({
    projectId: "",
    projectName: "",
    contractAmount: "",
    startDate: "",
    endDate: "",
    scope: "",
  });

  const [expandedEngagement, setExpandedEngagement] = useState<string | null>(null);

  const handleUpdateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await updateContractor.mutateAsync({ id, ...editContractorForm });
    setEditContractorDialog(false);
  };

  const handleDeleteContractor = async () => {
    if (!id) return;
    await deleteContractor.mutateAsync(id);
    setDeleteContractorDialog(false);
    navigate({ to: "/contractors" });
  };

  const handleCreateEngagement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await createEngagement.mutateAsync({
      contractorId: id,
      projectId: newEngagementForm.projectId,
      projectName: newEngagementForm.projectName || undefined,
      contractAmount: parseFloat(newEngagementForm.contractAmount),
      startDate: newEngagementForm.startDate || undefined,
      endDate: newEngagementForm.endDate || undefined,
      scope: newEngagementForm.scope || undefined,
    });
    setNewEngagementDialog(false);
    setNewEngagementForm({
      projectId: "",
      projectName: "",
      contractAmount: "",
      startDate: "",
      endDate: "",
      scope: "",
    });
  };

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
    <div className="space-y-6 flex flex-col ">
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
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Contractor not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/contractors" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{contractor.companyName}</h1>
            <Badge variant={contractor.isActive ? "success" : "secondary"}>
              {contractor.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={deleteContractorDialog} onOpenChange={setDeleteContractorDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Contractor</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground">
                  This action cannot be undone. This will permanently delete the contractor and all associated data.
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={() => setDeleteContractorDialog(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteContractor} disabled={deleteContractor.isPending}>
                    {deleteContractor.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={editContractorDialog} onOpenChange={setEditContractorDialog}>
              <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                setEditContractorForm({
                  companyName: contractor.companyName || "",
                  contactName: contractor.contactName || "",
                  email: contractor.email || "",
                  phone: contractor.phone || "",
                  specialization: contractor.specialization || "",
                  licenseNumber: contractor.licenseNumber || "",
                });
              }}>
                Edit Contractor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Contractor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateContractor} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    required
                    value={editContractorForm.companyName}
                    onChange={(e) => setEditContractorForm({ ...editContractorForm, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={editContractorForm.contactName}
                    onChange={(e) => setEditContractorForm({ ...editContractorForm, contactName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editContractorForm.email}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editContractorForm.phone}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Input
                      value={editContractorForm.specialization}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, specialization: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <Input
                      value={editContractorForm.licenseNumber}
                      onChange={(e) => setEditContractorForm({ ...editContractorForm, licenseNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" type="button" onClick={() => setEditContractorDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateContractor.isPending}>
                    {updateContractor.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Engagements</h2>
          <span className="text-sm text-muted-foreground">{engagements?.length ?? 0} total</span>
        </div>
        <Dialog open={newEngagementDialog} onOpenChange={setNewEngagementDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Engagement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Engagement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEngagement} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project ID</Label>
                  <Input
                    required
                    value={newEngagementForm.projectId}
                    onChange={(e) => setNewEngagementForm({ ...newEngagementForm, projectId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input
                    value={newEngagementForm.projectName}
                    onChange={(e) => setNewEngagementForm({ ...newEngagementForm, projectName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contract Amount</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={newEngagementForm.contractAmount}
                  onChange={(e) => setNewEngagementForm({ ...newEngagementForm, contractAmount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newEngagementForm.startDate}
                    onChange={(e) => setNewEngagementForm({ ...newEngagementForm, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={newEngagementForm.endDate}
                    onChange={(e) => setNewEngagementForm({ ...newEngagementForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scope / Description</Label>
                <Input
                  value={newEngagementForm.scope}
                  onChange={(e) => setNewEngagementForm({ ...newEngagementForm, scope: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setNewEngagementDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEngagement.isPending}>
                  {createEngagement.isPending ? "Creating..." : "Create Engagement"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!engagements || engagements.length === 0 ? (
        <Card className="flex-1 flex flex-col justify-center items-center overflow-hidden">
          <CardContent className="flex-1 w-full p-12 text-center flex flex-col justify-center items-center">
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
                  <p className="font-semibold">{formatCurrency(Number(eng.contractAmount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="font-semibold">{formatCurrency(Number(eng.paidAmount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-semibold">{formatCurrency(Number(eng.contractAmount - eng.paidAmount))}</p>
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




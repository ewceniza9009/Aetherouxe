import { EmptyState } from "@/components/ui/empty-state";
import { useState, useMemo, Fragment } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { ListPager } from "@/components/ListPager";
import { Card, CardContent } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@elite-realty/shared-ui/components/ui";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  HardHat,
  Phone,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react";
import { useContractors, useEngagements, useCreateContractor, useDeleteContractor } from "@/hooks/use-contractors";
import type { Contractor } from "@/hooks/use-contractors";
import { formatCurrency } from "@/lib/agent-meta";

export default function ContractorsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [specFilter, setSpecFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [engagementFilter, setEngagementFilter] = useState<string>("");

  const fullQuery = useMemo(() => ({
    ...query,
    specialization: specFilter !== "all" ? specFilter : undefined,
  }), [query, specFilter]);

  const { data, isLoading, isError, refetch } = useContractors(fullQuery);
  const { data: engagements } = useEngagements(
    engagementFilter ? { contractorId: engagementFilter } : {}
  );

  const createContractor = useCreateContractor();
  const deleteContractor = useDeleteContractor();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contractor | null>(null);
  const [newContractorDialog, setNewContractorDialog] = useState(false);
  const [newContractorForm, setNewContractorForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
  });

  const contractors = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteContractor.mutateAsync(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContractor.mutateAsync(newContractorForm);
    setNewContractorDialog(false);
    setNewContractorForm({
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      specialization: "",
      licenseNumber: "",
    });
  };

  if (isError) {
    return (
      <div className="space-y-6 flex flex-col ">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Contractors</h1>
        </div>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">Failed to load contractors</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contractors</h1>
          <p className="text-muted-foreground">Manage contractors, engagements, and payments</p>
        </div>
        <Dialog open={newContractorDialog} onOpenChange={setNewContractorDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Contractor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Contractor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateContractor} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  required
                  value={newContractorForm.companyName}
                  onChange={(e) => setNewContractorForm({ ...newContractorForm, companyName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input
                  value={newContractorForm.contactName}
                  onChange={(e) => setNewContractorForm({ ...newContractorForm, contactName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newContractorForm.email}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newContractorForm.phone}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    value={newContractorForm.specialization}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, specialization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input
                    value={newContractorForm.licenseNumber}
                    onChange={(e) => setNewContractorForm({ ...newContractorForm, licenseNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" type="button" onClick={() => setNewContractorDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContractor.isPending}>
                  {createContractor.isPending ? "Creating..." : "Create Contractor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search contractors…"
        filters={
          <Select value={specFilter} onValueChange={(v) => { setSpecFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Specializations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              <SelectItem value="general_contractor">General Contractor</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="hvac">HVAC</SelectItem>
              <SelectItem value="roofing">Roofing</SelectItem>
              <SelectItem value="concrete">Concrete</SelectItem>
              <SelectItem value="framing">Framing</SelectItem>
              <SelectItem value="painting">Painting</SelectItem>
              <SelectItem value="landscaping">Landscaping</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={contractors.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th {...sortHeader("companyName", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Company{sortIndicator("companyName")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                    <th {...sortHeader("specialization", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Specialization{sortIndicator("specialization")}
                    </th>
                    <th {...sortHeader("licenseNumber", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      License{sortIndicator("licenseNumber")}
                    </th>
                    <th {...sortHeader("isActive", "px-4 py-3 text-left text-sm font-medium text-muted-foreground")}>
                      Status{sortIndicator("isActive")}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contractors.map((c: Contractor) => (
                    <Fragment key={c.id}>
                      <tr
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate({ to: `/contractors/${c.id}` })}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                              <HardHat className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{c.companyName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm">{c.contactName}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {c.email}
                            </p>
                            {c.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {c.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{c.specialization}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{c.licenseNumber || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={c.isActive ? "success" : "secondary"}>
                            {c.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate({ to: `/contractors/${c.id}` });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(c);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                const id = c.id;
                                setExpandedRow(expandedRow === id ? null : id);
                                setEngagementFilter(expandedRow === id ? "" : id);
                              }}
                            >
                              {expandedRow === c.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === c.id && engagements && (
                        <tr className="border-b bg-muted/20">
                          <td colSpan={6} className="p-0 border-t">
                            <div className="px-4 py-3">
                              <p className="text-sm font-medium mb-2">Engagements</p>
                              {engagements.length === 0 ? (
                                <EmptyState title="No engagements found" />
                              ) : (
                                <div className="space-y-2">
                                  {engagements.map((eng) => (
                                    <div key={eng.id} className="flex items-center justify-between bg-background rounded-md border p-3">
                                      <div>
                                        <p className="text-sm font-medium">{eng.projectName || `Project ${eng.projectId}`}</p>
                                        <p className="text-xs text-muted-foreground">{formatCurrency(Number(eng.contractAmount))} contract</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <p className="text-sm">{formatCurrency(Number(eng.paidAmount))} paid</p>
                                          <p className="text-xs text-muted-foreground">
                                            {eng.contractAmount > 0
                                              ? `${((eng.paidAmount / eng.contractAmount) * 100).toFixed(0)}%`
                                              : "0%"}
                                          </p>
                                        </div>
                                        <Badge variant={
                                          eng.status === "active" ? "default" :
                                          eng.status === "completed" ? "success" :
                                          eng.status === "terminated" ? "destructive" : "secondary"
                                        }>
                                          {eng.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPager meta={meta} page={page} onPageChange={setPage} />
          </GridState>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contractor</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteContractor.isPending}>
              {deleteContractor.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



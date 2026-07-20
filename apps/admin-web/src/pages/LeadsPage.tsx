import { useState } from 'react';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ListPager } from '@/components/ListPager';
import {
  useLeads,
  useCreateLead,
  useUpdateLead,
  useDeleteLead,
  type Lead,
  type LeadStatus,
} from '@/hooks/use-leads';

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};

const STATUS_VARIANT: Record<LeadStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  contacted: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  qualified: 'bg-violet-500/20 text-violet-400 border-violet-500/50',
  won: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  lost: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
};

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  source: '',
  status: 'new' as LeadStatus,
  notes: '',
  assignedToId: '',
};

export default function LeadsPage() {
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, query } = listQuery;
  const { data, isLoading, isError } = useLeads({
    ...query,
    search: search || undefined,
  });

  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY);

  const leads = data?.data ?? [];
  const meta = data?.meta;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      source: lead.source ?? '',
      status: lead.status,
      notes: lead.notes ?? '',
      assignedToId: lead.assignedToId ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Lead name is required.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      source: form.source.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      assignedToId: form.assignedToId || undefined,
    };
    try {
      if (editing) {
        await updateLead.mutateAsync({ id: editing.id, ...payload });
        toast.success('Lead updated.');
      } else {
        await createLead.mutateAsync(payload);
        toast.success('Lead created.');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save lead.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead.mutateAsync(id);
      toast.success('Lead deleted.');
    } catch {
      toast.error('Failed to delete lead.');
    }
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-2">
            Track prospective buyers and tenants through the inquiry pipeline.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Lead
        </Button>
      </div>

      <GridToolbar search={search} onSearchChange={setSearch} placeholder="Search leads..." />

      <div className="rounded-lg border border-border bg-card">
        <GridState
          isLoading={isLoading}
          isError={isError}
          isEmpty={leads.length === 0}
          onRetry={() => {}}
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Contact</TableHead>
                <TableHead className="text-muted-foreground">Source</TableHead>
                <TableHead className="text-muted-foreground">Property</TableHead>
                <TableHead className="text-muted-foreground">Assigned</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: Lead) => (
                <TableRow key={lead.id} className="border-border hover:bg-card/5 transition-colors">
                  <TableCell className="font-medium text-foreground">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{lead.email ?? '—'}</div>
                    <div className="text-xs">{lead.phone ?? ''}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.source ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.property?.propertyCode ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.assignedTo
                      ? `${lead.assignedTo.firstName ?? ''} ${lead.assignedTo.lastName ?? ''}`.trim() ||
                        lead.assignedTo.email
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${STATUS_VARIANT[lead.status]} border`}>
                      {STATUS_LABELS[lead.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(lead.id)}
                        disabled={deleteLead.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ListPager meta={meta} page={page} onPageChange={setPage} itemLabel="leads" />
        </GridState>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Lead' : 'New Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="l-name">Name *</Label>
              <Input
                id="l-name"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="l-email">Email</Label>
                <Input
                  id="l-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-phone">Phone</Label>
                <Input
                  id="l-phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="walk_in">Walk-in</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v as LeadStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-notes">Notes</Label>
              <Input
                id="l-notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Initial inquiry details..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLead.isPending || updateLead.isPending}>
                {(createLead.isPending || updateLead.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? 'Save Changes' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListQuery } from '@/hooks/use-list-query';
import { GridState } from '@/components/GridToolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Percent, Trash2, Pencil } from 'lucide-react';
import {
  useCommissions,
  useCreateCommission,
  useUpdateCommission,
  useDeleteCommission,
  type CommissionRule,
  type CommissionRulePayload,
  type CommissionRuleScope,
  type CommissionRulePropertyScope,
  type CommissionRuleType,
} from '@/hooks/use-commissions';
import { TIER_LABELS, COMMISSION_TYPE_LABELS, formatCurrency } from '@/lib/agent-meta';
import { PropertyType } from '@elite-realty/shared-types';
import { ListPager } from '@/components/ListPager';

const PROPERTY_LABELS: Record<string, string> = {
  all: 'All Types',
  [PropertyType.CondoUnit]: 'Condo Unit',
  [PropertyType.HouseAndLot]: 'House & Lot',
  [PropertyType.Townhouse]: 'Townhouse',
  [PropertyType.CommercialSpace]: 'Commercial Space',
  [PropertyType.ParkingSlot]: 'Parking Slot',
};

const EMPTY_FORM: CommissionRulePayload = {
  name: '',
  tier: 'all',
  propertyType: 'all',
  type: 'percentage_of_sale',
  value: 0,
  status: 'active',
};

export default function CommissionsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(20);
  const { page, setPage, sort, setSort, order, setOrder, query, sortHeader, sortIndicator } =
    listQuery;

  const fullQuery = useMemo(
    () => ({
      ...query,
      status: undefined as 'active' | 'inactive' | undefined,
    }),
    [query],
  );

  const { data, isLoading, isError } = useCommissions(fullQuery);
  const createCommission = useCreateCommission();
  const updateCommission = useUpdateCommission();
  const deleteCommission = useDeleteCommission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionRule | null>(null);
  const [form, setForm] = useState<CommissionRulePayload>(EMPTY_FORM);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (rule: CommissionRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      tier: rule.tier,
      propertyType: rule.propertyType,
      type: rule.type,
      value: typeof rule.value === 'number' ? rule.value : Number(rule.value ?? 0),
      status: rule.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateCommission.mutateAsync({ id: editing.id, ...form });
    } else {
      await createCommission.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const rules = data?.data ?? [];

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Rules</h1>
          <p className="text-muted-foreground">
            Configure commission structures by tier and property type
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Commission Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-accent" /> Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={rules.length === 0}
            onRetry={() => {}}
            emptyState={
              <div className="py-16 text-center">
                <Percent className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="font-medium text-muted-foreground">No commission rules</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a rule to start calculating agent commissions.
                </p>
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead {...sortHeader('name')}>Rule Name{sortIndicator('name')}</TableHead>
                  <TableHead {...sortHeader('tier')}>Tier{sortIndicator('tier')}</TableHead>
                  <TableHead {...sortHeader('propertyType')}>
                    Property Type{sortIndicator('propertyType')}
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead {...sortHeader('isActive')}>
                    Status{sortIndicator('isActive')}
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                          <Percent className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{rule.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {rule.tier === 'all' ? (
                        <Badge variant="outline">All Tiers</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {(TIER_LABELS as Record<string, string>)[rule.tier] ?? rule.tier}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{PROPERTY_LABELS[rule.propertyType] ?? rule.propertyType}</TableCell>
                    <TableCell>
                      {(COMMISSION_TYPE_LABELS as Record<string, string>)[rule.type] ?? rule.type}
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums text-primary">
                      {rule.type === 'flat_amount'
                        ? formatCurrency(Number(rule.value ?? 0))
                        : rule.type === 'tiered'
                          ? Array.isArray(rule.value)
                            ? rule.value.map((t: { rate?: number }) => `${t.rate}%`).join(' / ')
                            : '—'
                          : `${Number(rule.value ?? 0)}%`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rule.status === 'active' ? 'success' : 'secondary'}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCommission.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <ListPager meta={data?.meta} page={page} onPageChange={setPage} itemLabel="rules" />
          </GridState>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Commission Rule' : 'New Commission Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Rule Name *</Label>
              <Input
                id="c-name"
                required
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Senior Condo Sales"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select
                  value={form.tier}
                  onValueChange={(v) => setForm((p) => ({ ...p, tier: v as CommissionRuleScope }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    {(
                      ['junior', 'senior', 'team_lead', 'external_broker'] as CommissionRuleScope[]
                    ).map((t) => (
                      <SelectItem key={t} value={t}>
                        {(TIER_LABELS as Record<string, string>)[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select
                  value={form.propertyType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, propertyType: v as CommissionRulePropertyScope }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROPERTY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v as CommissionRuleType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_amount">Flat Amount</SelectItem>
                    <SelectItem value="percentage_of_sale">Percentage of Sale</SelectItem>
                    <SelectItem value="percentage_of_rent">Percentage of Rent</SelectItem>
                    <SelectItem value="tiered">Tiered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-value">
                  {form.type === 'tiered' ? 'Tier Rates (auto)' : 'Value'}
                </Label>
                {form.type === 'tiered' ? (
                  <p className="text-sm text-muted-foreground">
                    Tiered rates are generated automatically from the sale price brackets.
                  </p>
                ) : (
                  <Input
                    id="c-value"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={Number(form.value ?? 0)}
                    onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))}
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as 'active' | 'inactive' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCommission.isPending || updateCommission.isPending}
              >
                {editing ? 'Save Changes' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

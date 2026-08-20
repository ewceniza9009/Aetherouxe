import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import { ListPager } from '@/components/ListPager';
import { Card, CardContent } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@elite-realty/shared-ui/components/ui';
import { Eye, Trash2 } from 'lucide-react';
import { useUnits, useDeleteUnit, type Unit } from '@/hooks/use-units';
import { formatCurrency } from '@/lib/agent-meta';
import { formatEnumLabel } from '@elite-realty/shared-ui';

export default function AllUnitsPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(10);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } =
    listQuery;
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  const fullQuery = useMemo(
    () => ({
      ...query,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    [query, typeFilter],
  );

  const { data: result, isLoading, isError, refetch } = useUnits(fullQuery);
  const deleteUnit = useDeleteUnit();

  const units = result?.data ?? [];
  const meta = result?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Units</h1>
            <p className="text-muted-foreground">Manage all units across the portfolio</p>
          </div>
        </div>
      </div>

      <GridToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search units…"
        filters={
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              resetPage();
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Unit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="one_br">1 BR</SelectItem>
              <SelectItem value="two_br">2 BR</SelectItem>
              <SelectItem value="three_br">3 BR</SelectItem>
              <SelectItem value="penthouse">Penthouse</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={units.length === 0}
            onRetry={() => refetch()}
          >
            <div className="rounded-md border scroll-grid overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th
                      {...sortHeader(
                        'unitNumber',
                        'px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap',
                      )}
                    >
                      Unit{sortIndicator('unitNumber')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Property & Building
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th
                      {...sortHeader(
                        'listPrice',
                        'px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap',
                      )}
                    >
                      List Price{sortIndicator('listPrice')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u: Unit) => {
                    const status = u.status;
                    const variant =
                      status === 'occupied'
                        ? 'success'
                        : status === 'available'
                          ? 'default'
                          : 'secondary';
                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{u.unitNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">
                              {u.property?.name ?? u.projectName ?? 'Unknown Project/Property'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {u.building?.name ?? '--'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{formatEnumLabel(u.type) || '--'}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.listPrice ? (
                            <span className="tabular-nums">{formatCurrency(u.listPrice)}</span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={variant as any}>
                            {formatEnumLabel(status) || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {u.owner ? (
                            <span className="font-medium">{u.owner}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Unowned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.tenant ? (
                            <span className="font-medium">{u.tenant}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">Vacant</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (u.propertyId) {
                                  navigate({
                                    to: `/properties/${u.propertyId}/units/${u.id}/edit`,
                                  });
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(u);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
            <DialogTitle>Delete Unit</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteUnit.mutateAsync(deleteTarget.id);
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              }}
              disabled={deleteUnit.isPending}
            >
              {deleteUnit.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

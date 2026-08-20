import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useListQuery } from '@/hooks/use-list-query';
import { GridToolbar, GridState } from '@/components/GridToolbar';
import { Card, CardContent, CardHeader, CardTitle } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import { Separator } from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@elite-realty/shared-ui/components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Home,
  Banknote,
  ClipboardList,
  Users,
  FileText,
  Loader2,
  User,
  UserCheck,
  Clock,
  Building2,
  AlertCircle,
  Filter,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { useUsers } from '@/hooks/use-users';
import { useAgents } from '@/hooks/use-agents';
import { useSchemes } from '@/hooks/use-schemes';
import { formatCurrency } from '@/lib/agent-meta';
import { api } from '@elite-realty/shared-ui/lib/api';
import { getErrorMessage } from '@/lib/error';

const UNIT_STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  available: {
    label: 'Available',
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  reserved: {
    label: 'Reserved',
    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    icon: Clock,
  },
  occupied: {
    label: 'Occupied',
    cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: UserCheck,
  },
  rented: {
    label: 'Rented',
    cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    icon: UserCheck,
  },
  rto_active: {
    label: 'RTO Active',
    cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    icon: Sparkles,
  },
  under_maintenance: {
    label: 'Maintenance',
    cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    icon: AlertCircle,
  },
  sold: {
    label: 'Sold',
    cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    icon: Tag,
  },
};

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  standard_rental: {
    label: 'Rental',
    cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  spot_cash: {
    label: 'Spot Cash',
    cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  installment: {
    label: 'Installment',
    cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  mortgage_assisted: {
    label: 'Mortgage',
    cls: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  },
  rent_to_own: {
    label: 'RTO',
    cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
};

const STEPS = [
  { label: 'Select Scheme', icon: FileText },
  { label: 'Select Unit', icon: Home },
  { label: 'Configure', icon: Users },
  { label: 'Confirm', icon: Check },
];

export default function SalesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schemeListQuery = useListQuery(500);
  const unitListQuery = useListQuery(500);
  const { search: schemeSearch, setSearch: setSchemeSearch } = schemeListQuery;
  const { search: unitSearch, setSearch: setUnitSearch } = unitListQuery;
  const { data: unitsData, isLoading: unitsLoading } = useUnits({
    limit: 500,
  });
  const { data: residentsData } = useUsers({ limit: 500 });
  const { data: agentsData, isLoading: agentsLoading } = useAgents({ limit: 500 });
  const { data: schemeTemplatesResult, isLoading: schemesLoading } = useSchemes();
  const schemeTemplates = schemeTemplatesResult?.data;

  const units = unitsData?.data ?? [];
  const residents = residentsData?.data ?? [];
  const agents = agentsData?.data ?? [];
  const templates = useMemo(
    () => (schemeTemplates ?? []).filter((t: { isActive?: boolean }) => t.isActive),
    [schemeTemplates],
  );

  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<
    import('@/hooks/use-schemes').Scheme | null
  >(null);
  const [selectedUnit, setSelectedUnit] = useState<import('@/hooks/use-units').Unit | null>(null);
  const [buyerId, setBuyerId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [price, setPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [confirmModalUnit, setConfirmModalUnit] = useState<any | null>(null);

  const debouncedSchemeSearch = schemeListQuery.debouncedSearch;
  const filteredTemplates = useMemo(() => {
    if (!debouncedSchemeSearch) return templates;
    const q = debouncedSchemeSearch.toLowerCase();
    return templates.filter(
      (t: any) =>
        t.code?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q) ||
        t.schemeType?.toLowerCase().includes(q),
    );
  }, [templates, debouncedSchemeSearch]);

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'available' | 'reserved' | 'occupied' | 'under_maintenance'
  >('all');

  const unitCounts = useMemo(() => {
    const counts = { all: units.length, available: 0, reserved: 0, occupied: 0, maintenance: 0 };
    units.forEach((u: any) => {
      const s = (u.status || '').toLowerCase();
      if (s === 'available') counts.available++;
      else if (s === 'reserved') counts.reserved++;
      else if (['occupied', 'rented', 'rto_active', 'sold'].includes(s)) counts.occupied++;
      else if (s === 'under_maintenance' || s === 'maintenance') counts.maintenance++;
    });
    return counts;
  }, [units]);

  const debouncedUnitSearch = unitListQuery.debouncedSearch;
  const filteredUnits = useMemo(() => {
    return units.filter((u: any) => {
      const s = (u.status || '').toLowerCase();
      if (statusFilter === 'available' && s !== 'available') return false;
      if (statusFilter === 'reserved' && s !== 'reserved') return false;
      if (statusFilter === 'occupied' && !['occupied', 'rented', 'rto_active', 'sold'].includes(s))
        return false;
      if (statusFilter === 'under_maintenance' && s !== 'under_maintenance' && s !== 'maintenance')
        return false;

      if (!debouncedUnitSearch) return true;
      const q = debouncedUnitSearch.toLowerCase();
      const occupant = (u.tenant || u.reserver || u.owner || '').toLowerCase();
      return (
        u.unitNumber?.toLowerCase().includes(q) ||
        u.property?.propertyCode?.toLowerCase().includes(q) ||
        (u.type ?? u.unitType ?? '').toLowerCase().includes(q) ||
        occupant.includes(q)
      );
    });
  }, [units, statusFilter, debouncedUnitSearch]);

  const isRto = selectedTemplate?.schemeType === 'rent_to_own';
  const needsValue = selectedTemplate && !['standard_rental'].includes(selectedTemplate.schemeType);

  const goNext = () => setStep((s) => Math.min(s + 1, 3));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const selectTemplate = (t: any) => {
    setSelectedTemplate(t);
    setPrice('');
    setMonthlyRent('');
    goNext();
  };

  const selectUnit = (u: any) => {
    setSelectedUnit(u);
    if (u.listPrice) setPrice(String(u.listPrice));
    goNext();
  };

  const handleSelectUnitClick = (u: any) => {
    const statusKey = (u.status || '').toLowerCase();
    const isOccupied = ['occupied', 'rented', 'rto_active', 'sold'].includes(statusKey);
    const isMaintenance = statusKey === 'under_maintenance' || statusKey === 'maintenance';

    if (isOccupied || isMaintenance) {
      toast.error(`Unit ${u.unitNumber} is ${statusKey.replace('_', ' ')} and cannot be selected.`);
      return;
    }

    if (statusKey === 'reserved') {
      setConfirmModalUnit(u);
      return;
    }

    selectUnit(u);
  };

  const confirmReservedSelection = () => {
    if (confirmModalUnit) {
      selectUnit(confirmModalUnit);
      setConfirmModalUnit(null);
    }
  };

  const submit = async () => {
    if (!selectedTemplate || !selectedUnit) return;
    setSubmitting(true);
    setError('');
    try {
      const payload: any = {
        schemeId: selectedTemplate.id,
        unitId: selectedUnit.id,
        buyerUserId: buyerId,
        agentId,
      };
      if (price) payload.totalContractValue = Number(price);
      if (isRto && monthlyRent) payload.monthlyRentAmount = Number(monthlyRent);
      const { data } = await api.post('/sales/apply-scheme', payload);
      setResult(data.data ?? data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['units'] }),
        queryClient.invalidateQueries({ queryKey: ['leases'] }),
        queryClient.invalidateQueries({ queryKey: ['titles'] }),
        queryClient.invalidateQueries({ queryKey: ['rto'] }),
        queryClient.invalidateQueries({ queryKey: ['properties'] }),
      ]);
      toast.success('Scheme applied successfully');
      setStep(3);
    } catch (e) {
      setError(getErrorMessage(e, 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedTemplate(null);
    setSelectedUnit(null);
    setBuyerId('');
    setAgentId('');
    setPrice('');
    setMonthlyRent('');
    setResult(null);
    setError('');
  };

  return (
    <div className="space-y-6 flex flex-col ">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Schemes</h1>
          <p className="text-muted-foreground">Apply a scheme to a unit in a few steps.</p>
        </div>
      </div>

      {/* ── Step Indicator ── */}
      <div className="py-2">
        <div className="flex items-center justify-center gap-0 max-w-xl mx-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = step > i;
            const isCurrent = step === i;
            return (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary bg-primary/10 text-primary ring-4 ring-primary/10'
                          : 'border-border/60 bg-muted/30 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs mt-2 font-semibold ${
                      isCurrent
                        ? 'text-primary'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-20 h-[3px] mx-2 mt-[-18px] rounded-full ${
                      isCompleted ? 'bg-primary' : 'bg-border/60'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Step 1: Select Scheme */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Choose a Scheme Template</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select the payment scheme to apply to a unit.
                </p>
              </div>
              <Button variant="outline" size="default" onClick={() => navigate({ to: '/schemes' })}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Manage Schemes
              </Button>
            </div>

            <GridToolbar
              search={schemeSearch}
              onSearchChange={setSchemeSearch}
              placeholder="Search by code, name, or type..."
            />

            <GridState
              isLoading={schemesLoading}
              isError={false}
              isEmpty={filteredTemplates.length === 0}
              onRetry={() => {}}
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((t: any) => {
                  const badge = TYPE_BADGE[t.schemeType] ?? { label: t.schemeType, cls: '' };
                  return (
                    <button
                      key={t.id}
                      onClick={() => selectTemplate(t)}
                      className="text-left rounded-2xl border border-border/60 bg-card p-7 transition-all hover:border-primary/40 hover:bg-muted/20 hover:shadow-lg group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-lg font-bold group-hover:text-primary transition-colors">
                          {t.code}
                        </span>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </Badge>
                      </div>
                      {t.name && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{t.name}</p>
                      )}
                      <Separator className="mb-4" />
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                        {t.agentCommissionPercentage && (
                          <span>{t.agentCommissionPercentage}% commission</span>
                        )}
                        {t.penaltyPercent && <span>{t.penaltyPercent}% penalty</span>}
                        {t.graceDays && <span>{t.graceDays}d grace</span>}
                        {t.mortgageDownPaymentPercent && (
                          <span>{t.mortgageDownPaymentPercent}% DP</span>
                        )}
                        {t.interestRatePercent && <span>{t.interestRatePercent}% rate</span>}
                        {t.loanTermMonths && <span>{t.loanTermMonths}mo term</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </GridState>
          </div>
        )}

        {/* Step 2: Select Unit */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Choose a Unit</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Applying{' '}
                  <span className="font-semibold text-primary">{selectedTemplate?.code}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ml-2 ${TYPE_BADGE[selectedTemplate?.schemeType ?? '']?.cls ?? ''}`}
                  >
                    {TYPE_BADGE[selectedTemplate?.schemeType ?? '']?.label}
                  </Badge>
                </p>
              </div>
              <Button variant="ghost" size="default" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="h-8 text-xs font-semibold"
                >
                  All Units ({unitCounts.all})
                </Button>
                <Button
                  variant={statusFilter === 'available' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('available')}
                  className={`h-8 text-xs font-semibold ${
                    statusFilter === 'available'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Available ({unitCounts.available})
                </Button>
                <Button
                  variant={statusFilter === 'reserved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('reserved')}
                  className={`h-8 text-xs font-semibold ${
                    statusFilter === 'reserved'
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Reserved ({unitCounts.reserved})
                </Button>
                <Button
                  variant={statusFilter === 'occupied' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('occupied')}
                  className={`h-8 text-xs font-semibold ${
                    statusFilter === 'occupied'
                      ? 'bg-sky-600 hover:bg-sky-500 text-white'
                      : 'text-sky-400 border-sky-500/30 hover:bg-sky-500/10'
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  Occupied / Leased ({unitCounts.occupied})
                </Button>
                {unitCounts.maintenance > 0 && (
                  <Button
                    variant={statusFilter === 'under_maintenance' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('under_maintenance')}
                    className={`h-8 text-xs font-semibold ${
                      statusFilter === 'under_maintenance'
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                        : 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10'
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                    Maintenance ({unitCounts.maintenance})
                  </Button>
                )}
              </div>
            </div>

            <GridToolbar
              search={unitSearch}
              onSearchChange={setUnitSearch}
              placeholder="Search by unit no, property code, type, or tenant..."
            />

            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <GridState
                isLoading={unitsLoading}
                isError={false}
                isEmpty={filteredUnits.length === 0}
                onRetry={() => {}}
                emptyState={
                  <div className="py-20 text-center">
                    <Home className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-4 text-base text-muted-foreground">
                      {unitSearch
                        ? 'No units match your search criteria.'
                        : 'No units found for the selected status filter.'}
                    </p>
                  </div>
                }
              >
                <div className="scroll-grid max-h-[calc(100vh-320px)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                        <th className="px-5 py-4 text-left font-semibold">Unit</th>
                        <th className="px-5 py-4 text-left font-semibold">Property</th>
                        <th className="px-5 py-4 text-left font-semibold">Status</th>
                        <th className="px-5 py-4 text-left font-semibold">Occupant / Tenant</th>
                        <th className="px-5 py-4 text-left font-semibold">Type</th>
                        <th className="px-5 py-4 text-right font-semibold">Size</th>
                        <th className="px-5 py-4 text-center font-semibold">Beds / Baths</th>
                        <th className="px-5 py-4 text-right font-semibold">List Price</th>
                        <th className="px-5 py-4 text-right w-36">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.map((u: any) => {
                        const statusKey = (u.status || 'available').toLowerCase();
                        const statusConfig = UNIT_STATUS_BADGE[statusKey] ?? {
                          label: u.status || 'Unknown',
                          cls: 'bg-muted text-muted-foreground border-border',
                          icon: Home,
                        };
                        const StatusIcon = statusConfig.icon || Home;
                        const occupant = u.tenant || u.reserver || u.owner;
                        const isReserved = statusKey === 'reserved';
                        const isOccupied = ['occupied', 'rented', 'rto_active', 'sold'].includes(
                          statusKey,
                        );
                        const isMaintenance =
                          statusKey === 'under_maintenance' || statusKey === 'maintenance';

                        return (
                          <tr
                            key={u.id}
                            className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-5 py-4 font-semibold text-sm">
                              {u.unitNumber ?? '—'}
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                              {u.property?.propertyCode ?? '—'}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                variant="outline"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium ${statusConfig.cls}`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 text-sm">
                              {occupant ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {occupant.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-foreground">
                                    {occupant}
                                    {u.reserver && !u.tenant && (
                                      <span className="text-[10px] text-amber-400 font-normal ml-1.5">
                                        (Reserved)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/40 font-normal text-xs">
                                  Vacant
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm capitalize">
                              {(u.type ?? u.unitType ?? '—').replace(/_/g, ' ')}
                            </td>
                            <td className="px-5 py-4 text-right tabular-nums text-xs text-muted-foreground">
                              {u.size ? `${u.size}m²` : '—'}
                            </td>
                            <td className="px-5 py-4 text-center text-xs tabular-nums">
                              {u.bedrooms ?? 0} bd / {u.bathrooms ?? 0} ba
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-sm tabular-nums">
                              {u.listPrice ? formatCurrency(u.listPrice) : '—'}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {isOccupied || isMaintenance ? (
                                <Button
                                  size="default"
                                  disabled
                                  variant="outline"
                                  className="h-9 px-3.5 text-xs font-semibold opacity-40 cursor-not-allowed border-border text-muted-foreground"
                                >
                                  {isOccupied ? 'Occupied' : 'Maintenance'}
                                </Button>
                              ) : (
                                <Button
                                  size="default"
                                  variant={isReserved ? 'secondary' : 'default'}
                                  className={`h-9 px-3.5 text-xs font-semibold ${
                                    isReserved
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                  onClick={() => handleSelectUnitClick(u)}
                                >
                                  {isReserved ? 'Select (Reserved)' : 'Select'}
                                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GridState>
            </div>
          </div>
        )}

        {/* Step 3: Configure */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Configure Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Assign buyer & agent to{' '}
                  <span className="font-semibold text-primary">{selectedUnit?.unitNumber}</span>
                </p>
              </div>
              <Button variant="ghost" size="default" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Scheme Summary */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold">Scheme Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{selectedTemplate?.code}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${TYPE_BADGE[selectedTemplate?.schemeType ?? '']?.cls ?? ''}`}
                    >
                      {TYPE_BADGE[selectedTemplate?.schemeType ?? '']?.label}
                    </Badge>
                  </div>
                  {selectedTemplate?.name && (
                    <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
                  )}
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedTemplate?.penaltyPercent && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Penalty</span>
                        <span className="font-semibold">
                          {selectedTemplate.penaltyPercent}%/day
                        </span>
                      </div>
                    )}
                    {selectedTemplate?.graceDays && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">
                          Grace Period
                        </span>
                        <span className="font-semibold">{selectedTemplate.graceDays} days</span>
                      </div>
                    )}
                    {selectedTemplate?.agentCommissionPercentage && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Commission</span>
                        <span className="font-semibold">
                          {selectedTemplate.agentCommissionPercentage}%
                        </span>
                      </div>
                    )}
                    {selectedTemplate?.mortgageDownPaymentPercent && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">
                          Down Payment
                        </span>
                        <span className="font-semibold">
                          {selectedTemplate.mortgageDownPaymentPercent}%
                        </span>
                      </div>
                    )}
                    {selectedTemplate?.interestRatePercent && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">
                          Interest Rate
                        </span>
                        <span className="font-semibold">
                          {selectedTemplate.interestRatePercent}%
                        </span>
                      </div>
                    )}
                    {selectedTemplate?.loanTermMonths && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Loan Term</span>
                        <span className="font-semibold">
                          {selectedTemplate.loanTermMonths} months
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Unit Details */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold">Unit Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Unit</span>
                      <span className="font-semibold">{selectedUnit?.unitNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Property</span>
                      <span className="font-semibold">
                        {selectedUnit?.property?.propertyCode ?? '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Type</span>
                      <span className="font-semibold capitalize">
                        {(selectedUnit?.type ?? selectedUnit?.unitType ?? '—').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Size</span>
                      <span className="font-semibold">
                        {selectedUnit?.size ? `${selectedUnit.size}m²` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">Status</span>
                      {(() => {
                        const statusKey = (selectedUnit?.status || 'available').toLowerCase();
                        const statusConfig = UNIT_STATUS_BADGE[statusKey] ?? {
                          label: selectedUnit?.status || 'Unknown',
                          cls: 'bg-muted text-muted-foreground border-border',
                          icon: Home,
                        };
                        const StatusIcon = statusConfig.icon || Home;
                        return (
                          <Badge
                            variant="outline"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium ${statusConfig.cls}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs mb-1">
                        Occupant / Tenant
                      </span>
                      <span className="font-semibold">
                        {selectedUnit?.tenant || selectedUnit?.reserver || selectedUnit?.owner || (
                          <span className="text-muted-foreground/40 font-normal">Vacant</span>
                        )}
                      </span>
                    </div>
                  </div>
                  {selectedUnit?.listPrice && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1">
                            List Price
                          </span>
                          <span className="font-bold text-base">
                            {formatCurrency(selectedUnit.listPrice)}
                          </span>
                        </div>
                        {selectedUnit?.lotValue != null && (
                          <div>
                            <span className="text-muted-foreground block text-xs mb-1">
                              Lot Value
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(selectedUnit.lotValue)}
                            </span>
                          </div>
                        )}
                        {selectedUnit?.buildingValue != null && (
                          <div>
                            <span className="text-muted-foreground block text-xs mb-1">
                              Building Value
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(selectedUnit.buildingValue)}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Assignment Form */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Buyer *</Label>
                    <Select value={buyerId} onValueChange={setBuyerId}>
                      <SelectTrigger className="h-11 text-sm">
                        <SelectValue placeholder="Select buyer" />
                      </SelectTrigger>
                      <SelectContent>
                        {residents.map((r: any) => (
                          <SelectItem key={r.id} value={r.id} className="text-sm">
                            {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Agent *</Label>
                    <Select value={agentId} onValueChange={setAgentId}>
                      <SelectTrigger className="h-11 text-sm">
                        <SelectValue placeholder={agentsLoading ? 'Loading...' : 'Select agent'} />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a: any) => (
                          <SelectItem key={a.id} value={a.id} className="text-sm">
                            {a.name || a.userId}
                            <span className="text-muted-foreground ml-1.5">({a.tier})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {needsValue && (
                  <div className="space-y-2 max-w-sm">
                    <Label className="text-sm">Total Contract Value *</Label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        className="pl-10 h-11 text-sm font-semibold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 5000000"
                      />
                    </div>
                    {price && !isNaN(Number(price)) && Number(price) > 0 && (
                      <p className="text-xs font-semibold text-emerald-400 pl-1 mt-1">
                        Formatted Value: {formatCurrency(Number(price))}
                      </p>
                    )}
                  </div>
                )}

                {isRto && (
                  <div className="space-y-2 max-w-sm">
                    <Label className="text-sm">Monthly Rent *</Label>
                    <Input
                      type="number"
                      className="h-11 text-sm"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      placeholder="e.g. 25000"
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                disabled={submitting || !buyerId || !agentId}
                onClick={submit}
                className="px-10 h-12 text-sm font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    Review & Apply
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 3 && result && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold mt-6">Scheme Applied Successfully</h2>
              <p className="text-base text-muted-foreground mt-2">
                All records have been generated for this transaction.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="grid grid-cols-2 gap-5 text-sm">
                  {result.leaseId && (
                    <div className="rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground text-xs block mb-1.5">
                        Lease Agreement
                      </span>
                      <span className="font-semibold text-base">Created</span>
                    </div>
                  )}
                  {result.mortgage?.periods && (
                    <div className="rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground text-xs block mb-1.5">
                        Mortgage Scenario
                      </span>
                      <span className="font-semibold text-base">
                        {result.mortgage.periods} amortization periods
                      </span>
                    </div>
                  )}
                  {result.rtoContractId && (
                    <div className="rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground text-xs block mb-1.5">
                        RTO Contract
                      </span>
                      <span className="font-semibold text-base">Equity ledger seeded</span>
                    </div>
                  )}
                  {result.invoice && (
                    <div className="rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground text-xs block mb-1.5">Invoice</span>
                      <span className="font-mono text-xs">{result.invoice.invoiceNumber}</span>
                      <span className="font-semibold text-base ml-2">
                        {formatCurrency(result.invoice.amount)}
                      </span>
                    </div>
                  )}
                  {result.agentTransaction && (
                    <div className="col-span-2 rounded-xl bg-muted/30 p-4">
                      <span className="text-muted-foreground text-xs block mb-1.5">
                        Agent Commission
                      </span>
                      <span className="font-semibold text-base">
                        {formatCurrency(result.agentTransaction.calculatedCommission)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        ({result.agentTransaction.commissionPercent}%)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button variant="outline" size="lg" onClick={reset}>
                Apply Another
              </Button>
              <Button size="lg" onClick={() => navigate({ to: '/' })}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reserved Unit Confirmation Modal */}
      <Dialog open={!!confirmModalUnit} onOpenChange={() => setConfirmModalUnit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 text-amber-400 mb-1">
              <AlertCircle className="h-6 w-6" />
              <DialogTitle className="text-lg">Unit Currently Reserved</DialogTitle>
            </div>
            <DialogDescription className="text-sm pt-2 text-muted-foreground">
              Unit <span className="font-bold text-foreground">{confirmModalUnit?.unitNumber}</span>{' '}
              ({confirmModalUnit?.property?.propertyCode}) is currently marked as{' '}
              <span className="font-semibold text-amber-400">Reserved</span>
              {confirmModalUnit?.reserver ? (
                <>
                  {' '}
                  by{' '}
                  <span className="font-semibold text-foreground">{confirmModalUnit.reserver}</span>
                  .
                </>
              ) : (
                '.'
              )}
              <br />
              <br />
              Applying a new sales scheme will override this reservation. Do you wish to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setConfirmModalUnit(null)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              onClick={confirmReservedSelection}
            >
              Proceed with Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

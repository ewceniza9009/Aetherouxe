import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
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
} from 'lucide-react';
import { useUnits } from '@/hooks/use-units';
import { useUsers } from '@/hooks/use-users';
import { useAgents } from '@/hooks/use-agents';
import { useSchemes } from '@/hooks/use-schemes';
import { formatCurrency } from '@/lib/agent-meta';
import { api } from '@elite-realty/shared-ui/lib/api';
import { getErrorMessage } from '@/lib/error';

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
  const schemeListQuery = useListQuery(500);
  const unitListQuery = useListQuery(500);
  const { search: schemeSearch, setSearch: setSchemeSearch } = schemeListQuery;
  const { search: unitSearch, setSearch: setUnitSearch } = unitListQuery;
  const { data: unitsData, isLoading: unitsLoading } = useUnits({ limit: 500 });
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

  const debouncedUnitSearch = unitListQuery.debouncedSearch;
  const availableUnits = useMemo(() => {
    return units.filter((u: any) => {
      if (u.status && u.status !== 'available') return false;
      if (!debouncedUnitSearch) return true;
      const q = debouncedUnitSearch.toLowerCase();
      return (
        u.unitNumber?.toLowerCase().includes(q) ||
        u.property?.propertyCode?.toLowerCase().includes(q)
      );
    });
  }, [units, debouncedUnitSearch]);

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
      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Schemes</h1>
          <p className="text-muted-foreground">Apply a scheme to a unit in a few steps.</p>
        </div>
      </div>

      {/* â”€â”€ Step Indicator â”€â”€ */}
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

      {/* â”€â”€ Content â”€â”€ */}
      <div>
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* Step 1: Select Scheme                        */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* Step 2: Select Unit                          */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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

            <GridToolbar
              search={unitSearch}
              onSearchChange={setUnitSearch}
              placeholder="Search units by block, lot, or code..."
            />

            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <GridState
                isLoading={unitsLoading}
                isError={false}
                isEmpty={availableUnits.length === 0}
                onRetry={() => {}}
                emptyState={
                  <div className="py-20 text-center">
                    <Home className="mx-auto h-10 w-10 text-muted-foreground/30" />
                    <p className="mt-4 text-base text-muted-foreground">
                      {unitSearch
                        ? 'No units match your search.'
                        : 'All units are occupied or reserved.'}
                    </p>
                  </div>
                }
              >
                <div className="scroll-grid max-h-[calc(100vh-300px)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                        <th className="px-6 py-4 text-left font-semibold">Unit</th>
                        <th className="px-6 py-4 text-left font-semibold">Property</th>
                        <th className="px-6 py-4 text-left font-semibold">Type</th>
                        <th className="px-6 py-4 text-right font-semibold">Size</th>
                        <th className="px-6 py-4 text-center font-semibold">Beds</th>
                        <th className="px-6 py-4 text-center font-semibold">Baths</th>
                        <th className="px-6 py-4 text-right font-semibold">List Price</th>
                        <th className="px-6 py-4 text-right w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableUnits.map((u: any) => (
                        <tr
                          key={u.id}
                          className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-sm">{u.unitNumber ?? '—'}</td>
                          <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                            {u.property?.propertyCode ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-sm capitalize">
                            {(u.type ?? u.unitType ?? '—').replace(/_/g, ' ')}
                          </td>
                          <td className="px-6 py-4 text-right tabular-nums text-xs text-muted-foreground">
                            {u.size ? `${u.size}m²` : '—'}
                          </td>
                          <td className="px-6 py-4 text-center text-xs tabular-nums">
                            {u.bedrooms ?? 0}
                          </td>
                          <td className="px-6 py-4 text-center text-xs tabular-nums">
                            {u.bathrooms ?? 0}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-sm tabular-nums">
                            {u.listPrice ? formatCurrency(u.listPrice) : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              size="default"
                              className="h-9 px-5 text-sm"
                              onClick={() => selectUnit(u)}
                            >
                              Select
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GridState>
            </div>
          </div>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* Step 3: Configure                           */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                  <div className="grid grid-cols-2 gap-4 text-sm">
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
                        className="pl-10 h-11 text-sm"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 5000000"
                      />
                    </div>
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

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* Step 4: Success                              */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  useScheme,
  useCreateScheme,
  useUpdateScheme,
  useDeleteScheme,
  SCHEME_TYPES,
  type Scheme,
  type SchemeTypeValue,
} from "@/hooks/use-schemes";

function Field({
  label,
  value,
  onChange,
  type = "number",
  step,
  disabled,
}: {
  label: string;
  value: number | string | undefined;
  onChange: (v: any) => void;
  type?: string;
  step?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? undefined : parseFloat(e.target.value)) : e.target.value)}
        disabled={disabled}
        className="h-8 text-sm"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function SectionCard({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold" style={{ color }}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">{children}</CardContent>
    </Card>
  );
}

export default function SchemeDetailPage() {
  const { id } = useParams({ from: "/protected/schemes/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const { data: existing, isLoading: loadingScheme } = useScheme(isNew ? "" : id);
  const createScheme = useCreateScheme();
  const updateScheme = useUpdateScheme();
  const deleteScheme = useDeleteScheme();

  const [form, setForm] = useState<Partial<Scheme>>({
    schemeType: "installment",
    isActive: true,
    isLocked: false,
  });

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.code) return;
    if (isNew) {
      const result = await createScheme.mutateAsync(form);
      navigate({ to: `/schemes/${result.id}` });
    } else {
      await updateScheme.mutateAsync({ ...form, id } as any);
    }
  };

  const handleDelete = async () => {
    if (!isNew && confirm("Delete this scheme?")) {
      await deleteScheme.mutateAsync(id);
      navigate({ to: "/schemes" });
    }
  };

  if (!isNew && loadingScheme) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const schemeType = form.schemeType as SchemeTypeValue;

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/schemes" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Scheme" : `Scheme: ${form.code}`}
            </h1>
            {form.name && <p className="text-sm text-muted-foreground">{form.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={createScheme.isPending || updateScheme.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createScheme.isPending || updateScheme.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Code *" value={form.code} onChange={(v) => set("code", v)} disabled={form.isLocked} />
          <Field label="Name" value={form.name as any} onChange={(v) => set("name", v)} type="text" />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Transaction Type *</Label>
            <Select value={schemeType} onValueChange={(v) => set("schemeType", v)} disabled={form.isLocked}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHEME_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField label="Remarks" value={form.remarks} onChange={(v) => set("remarks", v)} rows={2} />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="flex gap-2">
              <Button
                variant={form.isActive ? "default" : "outline"}
                size="sm"
                onClick={() => set("isActive", true)}
              >Active</Button>
              <Button
                variant={!form.isActive ? "destructive" : "outline"}
                size="sm"
                onClick={() => set("isActive", false)}
              >Inactive</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type-specific sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Standard Rental */}
        {schemeType === "standard_rental" && (
          <SectionCard title="Rental Terms" color="rgba(59,130,246,0.7)">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Security Deposit %" value={form.securityDepositPercent} onChange={(v) => set("securityDepositPercent", v)} />
              <Field label="Penalty % per day" value={form.penaltyPercent} onChange={(v) => set("penaltyPercent", v)} />
              <Field label="Grace Days" value={form.graceDays} onChange={(v) => set("graceDays", v)} />
            </div>
          </SectionCard>
        )}

        {/* Spot Cash */}
        {schemeType === "spot_cash" && (
          <SectionCard title="Spot Cash Terms" color="rgba(16,185,129,0.7)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Discount %" value={form.discountPercent} onChange={(v) => set("discountPercent", v)} />
            </div>
          </SectionCard>
        )}

        {/* Installment */}
        {schemeType === "installment" && (
          <>
            <SectionCard title="Downpayment" color="rgba(59,130,246,0.7)">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="# Payments" value={form.dpNumberOfPayments} onChange={(v) => set("dpNumberOfPayments", v)} />
                <Field label="Days from DP" value={form.dpNumberOfDaysFromDp} onChange={(v) => set("dpNumberOfDaysFromDp", v)} />
                <Field label="Amount" value={form.dpAmount} onChange={(v) => set("dpAmount", v)} step="0.01" />
              </div>
              <TextField label="Remarks" value={form.dpRemarks} onChange={(v) => set("dpRemarks", v)} rows={2} />
            </SectionCard>

            <SectionCard title="Equity" color="rgba(34,197,94,0.7)">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="# Payments" value={form.eqNumberOfPayments} onChange={(v) => set("eqNumberOfPayments", v)} />
                <Field label="Days from DP" value={form.eqNumberOfDaysFromDp} onChange={(v) => set("eqNumberOfDaysFromDp", v)} />
                <Field label="Amount" value={form.eqAmount} onChange={(v) => set("eqAmount", v)} step="0.01" />
                <Field label="EQ Payment %" value={form.eqPaymentPercentage} onChange={(v) => set("eqPaymentPercentage", v)} step="0.0001" />
                <Field label="EQ DP %" value={form.eqDownpaymentPercentage} onChange={(v) => set("eqDownpaymentPercentage", v)} step="0.0001" />
                <Field label="EQ Monthly Amort %" value={form.eqMonthlyAmortPercentage} onChange={(v) => set("eqMonthlyAmortPercentage", v)} step="0.0001" />
                <Field label="EQ Discount %" value={form.eqDiscountPercentage} onChange={(v) => set("eqDiscountPercentage", v)} step="0.0001" />
                <Field label="Order Sequence #" value={form.eqPaymentOrderNumber} onChange={(v) => set("eqPaymentOrderNumber", v)} />
              </div>
              <TextField label="Remarks" value={form.eqRemarks} onChange={(v) => set("eqRemarks", v)} rows={2} />
            </SectionCard>

            <SectionCard title="Balance" color="rgba(239,68,68,0.7)">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="# Payments" value={form.blNumberOfPayments} onChange={(v) => set("blNumberOfPayments", v)} />
                <Field label="Days from DP" value={form.blNumberOfDaysFromDp} onChange={(v) => set("blNumberOfDaysFromDp", v)} />
                <Field label="Amount" value={form.blAmount} onChange={(v) => set("blAmount", v)} step="0.01" />
                <Field label="BL Payment %" value={form.blPaymentPercentage} onChange={(v) => set("blPaymentPercentage", v)} step="0.0001" />
                <Field label="Misc %" value={form.blMiscPercentage} onChange={(v) => set("blMiscPercentage", v)} step="0.0001" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.blIsChangeOrder ?? false} onCheckedChange={(checked) => set("blIsChangeOrder", checked === true)} />
                  Change Order
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.blIncludeDpAmort ?? false} onCheckedChange={(checked) => set("blIncludeDpAmort", checked === true)} />
                  Include DP Amort
                </label>
              </div>
              <TextField label="Remarks" value={form.blRemarks} onChange={(v) => set("blRemarks", v)} rows={2} />
            </SectionCard>
          </>
        )}

        {/* Mortgage Assisted */}
        {schemeType === "mortgage_assisted" && (
          <SectionCard title="Mortgage Terms" color="rgba(168,85,247,0.7)">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Down Payment %" value={form.mortgageDownPaymentPercent} onChange={(v) => set("mortgageDownPaymentPercent", v)} step="0.01" />
              <Field label="Interest Rate %" value={form.interestRatePercent} onChange={(v) => set("interestRatePercent", v)} step="0.01" />
              <Field label="Loan Term (months)" value={form.loanTermMonths} onChange={(v) => set("loanTermMonths", v)} />
            </div>
          </SectionCard>
        )}

        {/* Rent-to-Own */}
        {schemeType === "rent_to_own" && (
          <SectionCard title="RTO Terms" color="rgba(244,63,94,0.7)">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Option Fee %" value={form.optionFeePercent} onChange={(v) => set("optionFeePercent", v)} step="0.01" />
              <Field label="Equity Accumulation %" value={form.equityAccumulationPercent} onChange={(v) => set("equityAccumulationPercent", v)} step="0.01" />
              <Field label="Target Purchase (years)" value={form.targetPurchaseYears} onChange={(v) => set("targetPurchaseYears", v)} />
            </div>
          </SectionCard>
        )}

        {/* Commissions — always shown for sale types */}
        {schemeType !== "standard_rental" && (
          <SectionCard title="Commissions" color="rgba(168,85,247,0.7)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Agent %" value={form.agentCommissionPercentage} onChange={(v) => set("agentCommissionPercentage", v)} step="0.0001" />
              <Field label="Company %" value={form.companyCommissionPercentage} onChange={(v) => set("companyCommissionPercentage", v)} step="0.0001" />
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

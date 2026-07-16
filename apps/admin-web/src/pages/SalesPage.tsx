import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Home, KeyRound, Building2, FileSignature, CheckCircle2 } from "lucide-react";
import { useUnits } from "@/hooks/use-units";
import { useUsers } from "@/hooks/use-users";
import { formatCurrency } from "@/lib/agent-meta";
import api from "@/lib/api";

const SCHEMES = [
  { value: "sale_mortgage", label: "Straight Sale + Mortgage", icon: Building2, desc: "Down payment + bank/home financing amortization." },
  { value: "rent_to_own", label: "Rent-to-Own", icon: KeyRound, desc: "Monthly equity build-up toward full ownership." },
  { value: "long_term_rental", label: "Long-term Rental", icon: Home, desc: "Standard recurring rental lease." },
  { value: "reservation", label: "Reservation Only", icon: FileSignature, desc: "Hold the unit with a reservation fee." },
] as const;

type SchemeValue = (typeof SCHEMES)[number]["value"];

export default function SalesPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useUnits({ limit: 500 });
  const { data: residentsData } = useUsers({ limit: 500 });
  const units = data?.data ?? [];

  const [scheme, setScheme] = useState<SchemeValue>("sale_mortgage");
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [buyerId, setBuyerId] = useState("");
  const [price, setPrice] = useState("");
  const [downPct, setDownPct] = useState("20");
  const [term, setTerm] = useState("360");
  const [rate, setRate] = useState("6.5");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [optionFee, setOptionFee] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const residents = residentsData?.data ?? [];

  const availableUnits = useMemo(
    () => units.filter((u) => u.status === "available" || !u.status),
    [units],
  );

  const openScheme = (unit: any) => {
    setSelectedUnit(unit);
    setResult(null);
    setError("");
    setBuyerId("");
    setPrice(unit?.price ? String(unit.price) : "");
    setMonthlyRent(unit?.monthlyRent ? String(unit.monthlyRent) : "");
    setOptionFee("");
  };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload: any = {
        schemeType: scheme,
        unitId: selectedUnit.id,
        buyerUserId: buyerId,
      };
      if (price) payload.totalContractValue = Number(price);
      if (scheme === "sale_mortgage") {
        payload.downPaymentPercent = Number(downPct);
        payload.interestRatePercent = Number(rate);
        payload.loanTermMonths = Number(term);
      }
      if (scheme === "rent_to_own") {
        if (monthlyRent) payload.monthlyRentAmount = Number(monthlyRent);
        payload.optionFeeAmount = Number(optionFee || 25000);
      }
      if (scheme === "reservation") {
        payload.optionFeeAmount = Number(optionFee || 25000);
      }
      const { data } = await api.post("/v1/sales/apply-scheme", payload);
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Sales & Schemes</h1>
        <p className="text-muted-foreground">Apply a purchase scheme to an available unit. Records, invoices and ledgers are generated automatically.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {SCHEMES.map((s) => {
          const Icon = s.icon;
          const active = scheme === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setScheme(s.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <Icon className={`mb-2 h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <div className="font-medium">{s.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Units ({availableUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : availableUnits.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No available units.</p>
          ) : (
            <div className="scroll-grid">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-left">Property</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {availableUnits.map((u) => (
                    <tr key={u.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.unitNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.property?.name ?? u.property?.propertyCode ?? "—"}</td>
                    <td className="px-4 py-3">{u.type ?? u.unitType ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "—"}
                    </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => openScheme(u)}>
                          Apply {SCHEMES.find((s) => s.value === scheme)?.label.split(" ")[0]}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUnit} onOpenChange={(o) => !o && setSelectedUnit(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply Scheme — {selectedUnit?.unitNumber}</DialogTitle>
            <DialogDescription>
              {SCHEMES.find((s) => s.value === scheme)?.label}. The lease, ledgers and invoice are created in one step.
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" /> Scheme applied successfully.
              </div>
              {result.leaseId && <p className="text-sm">Lease created.</p>}
              {result.mortgageScenarioId && <p className="text-sm">Mortgage scenario + amortization schedule created.</p>}
              {result.rtoContractId && <p className="text-sm">Rent-to-own contract + equity ledger created.</p>}
              {result.invoice && (
                <p className="text-sm">
                  Invoice <span className="font-mono">{result.invoice.invoiceNumber}</span> issued:{" "}
                  <span className="font-semibold">{formatCurrency(Number(result.invoice.amount))}</span> ({result.invoice.status})
                </p>
              )}
              <DialogFooter>
                <Button onClick={() => setSelectedUnit(null)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label>Buyer / Future Owner</Label>
                <Select value={buyerId} onValueChange={setBuyerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {[r.firstName, r.lastName].filter(Boolean).join(" ") || r.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(scheme === "sale_mortgage" || scheme === "rent_to_own") && (
                <div className="grid gap-2">
                  <Label>Total Contract Value (₱)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 5000000" />
                </div>
              )}

              {scheme === "sale_mortgage" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Down %</Label>
                    <Input type="number" value={downPct} onChange={(e) => setDownPct(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rate %</Label>
                    <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Term (mo)</Label>
                    <Input type="number" value={term} onChange={(e) => setTerm(e.target.value)} />
                  </div>
                </div>
              )}

              {scheme === "rent_to_own" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Monthly Rent (₱)</Label>
                    <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Option Fee (₱)</Label>
                    <Input type="number" value={optionFee} onChange={(e) => setOptionFee(e.target.value)} placeholder="auto 2%" />
                  </div>
                </div>
              )}

              {scheme === "reservation" && (
                <div className="grid gap-2">
                  <Label>Reservation Fee (₱)</Label>
                  <Input type="number" value={optionFee} onChange={(e) => setOptionFee(e.target.value)} placeholder="25000" />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedUnit(null)}>Cancel</Button>
                <Button disabled={submitting || !buyerId} onClick={submit}>
                  {submitting ? "Applying…" : "Apply Scheme & Issue Invoice"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

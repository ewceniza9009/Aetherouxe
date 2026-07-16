import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, AlertCircle } from "lucide-react";
import { LeaseType } from "@elite-realty/shared-types";
import { useProperties } from "@/hooks/use-properties";
import { useUsers } from "@/hooks/use-users";
import { useLease, useUpdateLease, type Lease } from "@/hooks/use-leases";

export default function EditLeasePage() {
  const { id } = useParams({ from: "/protected/leases/$id/edit" });
  const navigate = useNavigate();
  const { data: lease, isLoading, error } = useLease(id);
  const { data: propertiesData, isLoading: loadingProps } = useProperties({ limit: 100 });
  const { data: usersData, isLoading: loadingUsers } = useUsers({ userType: "tenant", limit: 500 });
  const updateLease = useUpdateLease();

  const [tenantUserId, setTenantUserId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [leaseType, setLeaseType] = useState<LeaseType>(LeaseType.StandardRental);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [penalty, setPenalty] = useState("");
  const [graceDays, setGraceDays] = useState("");

  const properties = propertiesData?.data ?? [];
  const residents = (usersData?.data ?? []).filter((u) => u.userType === "tenant");

  if (isLoading || !lease) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/leases/${id}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load lease</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initializeOnce = () => {
    if (tenantUserId || startDate || endDate || monthlyRent) return;
    setTenantUserId(lease.tenantUserId ?? "");
    setPropertyId(lease.propertyId ?? "");
    setLeaseType(lease.leaseType);
    setStartDate(lease.startDate?.slice(0, 10));
    setEndDate(lease.endDate?.slice(0, 10));
    setMonthlyRent(String(lease.monthlyRent));
    setDeposit(lease.securityDeposit != null ? String(lease.securityDeposit) : "");
    setPenalty(lease.penaltyPercent != null ? String(lease.penaltyPercent) : "");
    setGraceDays(lease.graceDays != null ? String(lease.graceDays) : "");
  };
  initializeOnce();

  const handleSubmit = async () => {
    const payload: Partial<Lease> & { id: string } = {
      id,
      tenantUserId,
      propertyId: propertyId || undefined,
      leaseType,
      startDate,
      endDate,
      monthlyRent: parseFloat(monthlyRent) || 0,
      securityDeposit: deposit ? parseFloat(deposit) : undefined,
      penaltyPercent: penalty ? parseFloat(penalty) : undefined,
      graceDays: graceDays ? parseInt(graceDays, 10) : undefined,
    };
    await updateLease.mutateAsync(payload);
    navigate({ to: `/leases/${id}` });
  };

  const canSubmit = tenantUserId && startDate && endDate && monthlyRent && !updateLease.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: `/leases/${id}` })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Lease</h1>
          <p className="text-muted-foreground">{lease.leaseNumber ?? lease.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant (Resident)</Label>
              <Select value={tenantUserId} onValueChange={setTenantUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Loading residents..." : "Select resident"} />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingProps ? "Loading properties..." : "Select property"} />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Lease Type</Label>
              <Select value={leaseType} onValueChange={(v) => setLeaseType(v as LeaseType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LeaseType.StandardRental}>Standard Rental</SelectItem>
                  <SelectItem value={LeaseType.RentToOwn}>Rent to Own</SelectItem>
                  <SelectItem value={LeaseType.CorporateLease}>Corporate Lease</SelectItem>
                  <SelectItem value={LeaseType.ShortTerm}>Short Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start Date</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End Date</Label>
              <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent">Monthly Rent</Label>
              <Input id="rent" type="number" step="0.01" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="deposit">Security Deposit</Label>
              <Input id="deposit" type="number" step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penalty">Penalty %</Label>
              <Input id="penalty" type="number" step="0.1" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grace">Grace Days</Label>
              <Input id="grace" type="number" value={graceDays} onChange={(e) => setGraceDays(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate({ to: `/leases/${id}` })}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {updateLease.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

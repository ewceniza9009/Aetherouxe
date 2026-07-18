import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import {
  Card,
  CardContent,
} from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import { Label } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@elite-realty/shared-ui/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Droplets, Flame, Loader2, Zap } from "lucide-react";
import {
  useMeters,
  useCreateMeter,
  type UtilityType,
  type UtilityMeter,
} from "@/hooks/use-utilities";
import { useProperties } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { utilityTypeMeta } from "@/lib/utility-meta";
import { ListPager } from "@/components/ListPager";

const utilityIcons: Record<UtilityType, React.ReactNode> = {
  water: <Droplets className="h-3.5 w-3.5" />,
  electricity: <Zap className="h-3.5 w-3.5" />,
  gas: <Flame className="h-3.5 w-3.5" />,
};

function UtilityPill({ type }: { type: UtilityType }) {
  const meta = utilityTypeMeta[type];
  return (
    <Badge className={meta.className}>
      <span className="mr-1 inline-flex">{utilityIcons[type]}</span>
      {meta.label}
    </Badge>
  );
}

function tenantName(meter?: UtilityMeter["resident"]) {
  if (!meter) return null;
  const full = [meter.firstName, meter.lastName].filter(Boolean).join(" ").trim();
  return full || meter.email;
}

function unitPropertyLabel(meter: UtilityMeter): string {
  const unit = meter.unit?.unitNumber;
  const prop = meter.property?.propertyCode || meter.property?.name;
  if (unit && prop) return `${prop} · ${unit}`;
  return unit || prop || "—";
}

export default function MetersPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, sort, setSort, order, setOrder, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [utilityType, setUtilityType] = useState<string>("all");
  const [propertyId, setPropertyId] = useState<string>("all");

  const fullQuery = useMemo(
    () => ({
      ...query,
      utilityType: utilityType !== "all" ? (utilityType as UtilityType) : undefined,
      propertyId: propertyId !== "all" ? propertyId : undefined,
    }),
    [query, utilityType, propertyId]
  );

  const { data, isLoading, isError, refetch } = useMeters(fullQuery);

  const { data: propertiesData } = useProperties({ limit: 200 });
  const properties = propertiesData?.data ?? [];

  const meters = data?.data ?? [];

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Meters &amp; Billing</h1>
          <p className="text-muted-foreground">Manage utility meters, readings, and bills</p>
        </div>
        <NewMeterDialog properties={properties} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <GridToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search meters..."
            filters={
              <>
                <Select value={utilityType} onValueChange={(v) => { setUtilityType(v); resetPage(); }}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Utility type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="electricity">Electricity</SelectItem>
                    <SelectItem value="gas">Gas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); resetPage(); }}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />

          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={meters.length === 0}
            onRetry={() => refetch()}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meter #</TableHead>
                  <TableHead {...sortHeader("utilityType")}>
                    Type{sortIndicator("utilityType")}
                  </TableHead>
                  <TableHead>Unit / Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead {...sortHeader("isActive")}>
                    Status{sortIndicator("isActive")}
                  </TableHead>
                  <TableHead className="text-right">Readings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: `/meters/${m.id}` })}
                  >
                    <TableCell className="font-medium font-mono">{m.meterNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <UtilityPill type={m.utilityType} />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{unitPropertyLabel(m)}</TableCell>
                    <TableCell className="text-sm">{tenantName(m.resident) ?? "—"}</TableCell>
                    <TableCell>
                      {m.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {m.readingsCount ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <ListPager meta={data?.meta} page={page} onPageChange={setPage} itemLabel="meters" />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

function NewMeterDialog({ properties }: { properties: { id: string; name: string; propertyCode?: string | null }[] }) {
  const createMeter = useCreateMeter();
  const [open, setOpen] = useState(false);
  const [meterNumber, setMeterNumber] = useState("");
  const [utilityType, setUtilityType] = useState<UtilityType>("water");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [multiplier, setMultiplier] = useState("1");
  const [installationDate, setInstallationDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: unitsData } = useUnits({ propertyId: propertyId || undefined, limit: 200 });
  const units = unitsData?.data ?? [];

  const reset = () => {
    setMeterNumber("");
    setUtilityType("water");
    setPropertyId("");
    setUnitId("");
    setMultiplier("1");
    setInstallationDate("");
    setIsActive(true);
  };

  const submit = async () => {
    await createMeter.mutateAsync({
      meterNumber,
      utilityType,
      propertyId: propertyId || undefined,
      unitId: unitId || undefined,
      multiplier: parseFloat(multiplier) || 1,
      installationDate: installationDate || undefined,
      isActive,
    });
    setOpen(false);
    reset();
  };

  const canSubmit = meterNumber && utilityType;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <Plus className="mr-2 h-4 w-4" /> New Meter
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Utility Meter</DialogTitle>
          <DialogDescription>Register a new water, electricity, or gas meter.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="meterNumber">Meter Number</Label>
              <Input
                id="meterNumber"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="WM-1024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utilityType">Utility Type</Label>
              <Select value={utilityType} onValueChange={(v) => setUtilityType(v as UtilityType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="property">Property</Label>
              <Select value={propertyId} onValueChange={(v) => { setPropertyId(v); setUnitId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.propertyCode || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Select value={unitId} onValueChange={setUnitId} disabled={!propertyId}>
                <SelectTrigger>
                  <SelectValue placeholder={propertyId ? "Select unit" : "Pick property first"} />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplier">Multiplier</Label>
              <Input
                id="multiplier"
                type="number"
                step="0.01"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installation">Installation Date</Label>
              <Input
                id="installation"
                type="date"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || createMeter.isPending}>
            {createMeter.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Meter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




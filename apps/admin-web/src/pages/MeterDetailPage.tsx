import { EmptyState } from "@/components/ui/empty-state";
import { useMemo, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  AlertCircle,
  Droplets,
  Zap,
  Flame,
  Gauge,
  CalendarDays,
  Hash,
  Loader2,
  Trash2,
  MoreHorizontal,
  Pencil,
  User,
} from "lucide-react";
import {
  useMeter,
  useMeterReadings,
  useMeters,
  useBills,
  useDeleteMeter,
  useUpdateMeter,
  useDeleteReading,
  type UtilityType,
  type UtilityMeter,
} from "@/hooks/use-utilities";
import { useProperties } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { AddReadingDialog, BulkReadingsDialog, EditReadingDialog } from "@/components/utilities/ReadingDialogs";
import { utilityTypeMeta, billStatusMeta, money, formatDate } from "@/lib/utility-meta";

const utilityIcons: Record<UtilityType, React.ReactNode> = {
  water: <Droplets className="h-4 w-4" />,
  electricity: <Zap className="h-4 w-4" />,
  gas: <Flame className="h-4 w-4" />,
};

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function MeterDetailPage() {
  const { id } = useParams({ from: "/protected/meters/$id" });
  const navigate = useNavigate();
  const { data: meter, isLoading, isError } = useMeter(id);
  const { data: readings, isLoading: loadingReadings } = useMeterReadings(id);
  const { data: billsData } = useBills({ meterId: id });
  const { data: metersData } = useMeters({ limit: 500 });
  const deleteMeter = useDeleteMeter();
  const deleteReading = useDeleteReading();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const meters = metersData?.data ?? [];
  const bills = billsData?.data ?? [];

  const readingsSorted = useMemo(
    () =>
      [...(readings ?? [])].sort((a, b) =>
        new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime()
      ),
    [readings]
  );

  if (isError) {
    return (
    <div className="space-y-6 flex flex-col ">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/meters" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">Failed to load meter</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !meter) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const meta = utilityTypeMeta[meter.utilityType];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: "/meters" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight">
                {meter.meterNumber}
              </h1>
              <Badge className={meta.className}>
                <span className="mr-1 inline-flex">{utilityIcons[meter.utilityType]}</span>
                {meta.label}
              </Badge>
              {meter.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Gauge className="h-4 w-4" />
                {meter.property?.propertyCode || meter.property?.name || "Unassigned"}
                {meter.unit?.unitNumber ? ` · ${meter.unit.unitNumber}` : ""}
              </p>
              {meter.resident && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <User className="h-4 w-4" />
                  {[meter.resident.firstName, meter.resident.lastName].filter(Boolean).join(" ") || meter.resident.email}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditMeterDialog meter={meter} />
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<Hash className="h-5 w-5" />} label="Multiplier" value={String(meter.multiplier)} />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Installation Date"
          value={formatDate(meter.installationDate)}
        />
        <SummaryCard
          icon={<Gauge className="h-5 w-5" />}
          label="Last Reading"
          value={
            readingsSorted[0]
              ? `${readingsSorted[0].value} · ${formatDate(readingsSorted[0].readingDate)}`
              : "—"
          }
        />
      </div>

      <Tabs.Root defaultValue="readings">
        <Tabs.List className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          <Tabs.Trigger
            value="readings"
            className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Readings
          </Tabs.Trigger>
          <Tabs.Trigger
            value="bills"
            className="rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            Bills
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="readings" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Consumption Readings</CardTitle>
                  <CardDescription>Meter readings used to compute consumption</CardDescription>
                </div>
                <div className="flex gap-2">
                  <AddReadingDialog meters={meters} defaultMeterId={meter.id} />
                  <BulkReadingsDialog meters={meters} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReadings ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : readingsSorted.length === 0 ? (
                <EmptyState title="No readings recorded yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Reader</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readingsSorted.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.readingDate)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{r.value}</TableCell>
                        <TableCell className="text-sm">{r.reader ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.note ?? "—"}</TableCell>
                        <TableCell className="flex items-center gap-1">
                          <EditReadingDialog
                            reading={r}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={async () => {
                              if (window.confirm("Are you sure you want to delete this reading?")) {
                                await deleteReading.mutateAsync(r.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="bills" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bills for this Meter</CardTitle>
              <CardDescription>Utility bills generated from readings</CardDescription>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <EmptyState title="No bills generated yet" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Consumption</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((b) => (
                      <TableRow key={b.id} className="cursor-pointer" onClick={() => navigate({ to: "/utility-bills" })}>
                        <TableCell className="text-sm">
                          {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{b.consumption}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(b.rate)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{money(b.amountDue)}</TableCell>
                        <TableCell>
                          <Badge className={billStatusMeta[b.status].className}>
                            {billStatusMeta[b.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(b.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meter</DialogTitle>
            <DialogDescription>
              This will permanently remove meter {meter.meterNumber}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteMeter.mutateAsync(meter.id);
                navigate({ to: "/meters" });
              }}
              disabled={deleteMeter.isPending}
            >
              {deleteMeter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditMeterDialog({ meter }: { meter: UtilityMeter }) {
  const updateMeter = useUpdateMeter();
  const [open, setOpen] = useState(false);
  const [meterNumber, setMeterNumber] = useState(meter.meterNumber);
  const [utilityType, setUtilityType] = useState<UtilityType>(meter.utilityType);
  const [propertyId, setPropertyId] = useState(meter.propertyId || "");
  const [unitId, setUnitId] = useState(meter.unitId || "");
  const [multiplier, setMultiplier] = useState(String(meter.multiplier));
  const [installationDate, setInstallationDate] = useState(
    meter.installationDate ? meter.installationDate.split("T")[0] : ""
  );
  const [isActive, setIsActive] = useState(meter.isActive);

  const { data: propertiesData } = useProperties({ limit: 200 });
  const properties = propertiesData?.data ?? [];

  const { data: unitsData } = useUnits({ propertyId: propertyId || undefined, limit: 200 });
  const units = unitsData?.data ?? [];

  const submit = async () => {
    await updateMeter.mutateAsync({
      id: meter.id,
      meterNumber,
      utilityType,
      propertyId: propertyId || null,
      unitId: unitId || null,
      multiplier: parseFloat(multiplier) || 1,
      installationDate: installationDate ? new Date(installationDate).toISOString() : null,
      isActive,
    } as any);
    setOpen(false);
  };

  const canSubmit = meterNumber && utilityType;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" /> Edit Meter
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Utility Meter</DialogTitle>
          <DialogDescription>Update the details and assignment for this meter.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Meter Number</Label>
            <Input value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Utility Type</Label>
            <Select value={utilityType} onValueChange={(v) => setUtilityType(v as UtilityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="electricity">Electricity</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Property</Label>
              <Select
                value={propertyId || "none"}
                onValueChange={(v) => {
                  setPropertyId(v === "none" ? "" : v);
                  setUnitId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Select
                value={unitId || "none"}
                onValueChange={(v) => setUnitId(v === "none" ? "" : v)}
                disabled={!propertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Multiplier</Label>
              <Input type="number" step="0.01" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Installation Date</Label>
              <Input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Checkbox
              id="is-active"
              checked={isActive}
              onCheckedChange={(c) => setIsActive(c as boolean)}
            />
            <Label htmlFor="is-active">Active Meter</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit || updateMeter.isPending}>
            {updateMeter.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


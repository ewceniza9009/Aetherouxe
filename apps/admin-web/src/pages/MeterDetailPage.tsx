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
} from "lucide-react";
import {
  useMeter,
  useMeterReadings,
  useMeters,
  useBills,
  useDeleteMeter,
  type UtilityType,
} from "@/hooks/use-utilities";
import { AddReadingDialog, BulkReadingsDialog } from "@/components/utilities/ReadingDialogs";
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
  const { id } = useParams({ from: "/meters/$id" });
  const navigate = useNavigate();
  const { data: meter, isLoading, isError } = useMeter(id);
  const { data: readings, isLoading: loadingReadings } = useMeterReadings(id);
  const { data: billsData } = useBills({ meterId: id });
  const { data: metersData } = useMeters({ limit: 500 });
  const deleteMeter = useDeleteMeter();
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
      <div className="space-y-6">
        <Button variant="outline" size="icon" onClick={() => navigate({ to: "/meters" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card>
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
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Gauge className="h-4 w-4" />
              {meter.property?.propertyCode || meter.property?.name || "Unassigned"}
              {meter.unit?.unitLabel ? ` · ${meter.unit.unitLabel}` : ""}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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
                <p className="py-8 text-center text-sm text-muted-foreground">No readings recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Reader</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {readingsSorted.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{formatDate(r.readingDate)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{r.value}</TableCell>
                        <TableCell className="text-sm">{r.reader ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.note ?? "—"}</TableCell>
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
                <p className="py-8 text-center text-sm text-muted-foreground">No bills generated yet.</p>
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

import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Gauge } from "lucide-react";
import {
  useReadings,
  useMeters,
  type UtilityType,
} from "@/hooks/use-utilities";
import { AddReadingDialog, BulkReadingsDialog } from "@/components/utilities/ReadingDialogs";
import { utilityTypeMeta, formatDate } from "@/lib/utility-meta";
import { type UtilityMeter } from "@/hooks/use-utilities";

function unitPropertyLabel(meter: UtilityMeter | null | undefined): string {
  if (!meter) return "—";
  const unit = meter.unit?.unitNumber;
  const prop = meter.property?.propertyCode || meter.property?.name;
  if (unit && prop) return `${prop} · ${unit}`;
  return unit || prop || "—";
}

function tenantName(resident?: UtilityMeter["resident"]): string | null {
  if (!resident) return null;
  const full = [resident.firstName, resident.lastName].filter(Boolean).join(" ").trim();
  return full || resident.email;
}

export default function ReadingsPage() {
  const navigate = useNavigate();
  const [meterId, setMeterId] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: metersData } = useMeters({ limit: 500 });
  const meters = metersData?.data ?? [];

  const { data, isLoading, isError, refetch } = useReadings({
    meterId: meterId !== "all" ? meterId : undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const readings = useMemo(() => {
    const all = data?.data ?? [];
    return [...all].sort(
      (a, b) =>
        new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime(),
    );
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Consumption Readings
          </h1>
          <p className="text-muted-foreground">
            All meter readings across properties
          </p>
        </div>
        <div className="flex gap-2">
          <AddReadingDialog meters={meters} />
          <BulkReadingsDialog meters={meters} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-accent" /> Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
            <Select value={meterId} onValueChange={setMeterId}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Meter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meters</SelectItem>
                {meters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.meterNumber} · {m.utilityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground">From</span>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-muted-foreground">To</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
          </div>
          {isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Failed to load readings.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : readings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Gauge className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No readings found.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Unit / Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Reader</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((r) => {
                  const type = (r.meter?.utilityType ??
                    meters.find((m) => m.id === r.meterId)?.utilityType) as
                    | UtilityType
                    | undefined;
                  return (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() =>
                        r.meterId && navigate({ to: `/meters/${r.meterId}` })
                      }
                    >
                      <TableCell className="font-mono text-sm">
                        {r.meter?.meterNumber ?? "—"}
                      </TableCell>
                      <TableCell>
                        {type ? (
                          <Badge className={utilityTypeMeta[type].className}>
                            {utilityTypeMeta[type].label}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {unitPropertyLabel(meters.find((m) => m.id === r.meterId))}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tenantName(meters.find((m) => m.id === r.meterId)?.resident) ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.readingDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {r.value}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.reader ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.note ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

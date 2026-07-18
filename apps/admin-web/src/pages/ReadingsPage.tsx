import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@elite-realty/shared-ui/components/ui";
import { Button } from "@elite-realty/shared-ui/components/ui";
import { Badge } from "@elite-realty/shared-ui/components/ui";
import { Input } from "@elite-realty/shared-ui/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@elite-realty/shared-ui/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gauge } from "lucide-react";
import {
  useReadings,
  useMeters,
  type UtilityType,
} from "@/hooks/use-utilities";
import { AddReadingDialog, BulkReadingsDialog } from "@/components/utilities/ReadingDialogs";
import { utilityTypeMeta, formatDate } from "@/lib/utility-meta";
import { type UtilityMeter } from "@/hooks/use-utilities";
import { ListPager } from "@/components/ListPager";

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
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [meterId, setMeterId] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: metersData } = useMeters({ limit: 500 });
  const meters = metersData?.data ?? [];

  const fullQuery = useMemo(
    () => ({
      ...query,
      meterId: meterId !== "all" ? meterId : undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [query, meterId, from, to]
  );

  const { data, isLoading, isError, refetch } = useReadings(fullQuery);

  const readings = data?.data ?? [];

  return (
    <div className="space-y-6 flex flex-col ">
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
          <GridToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search readings..."
            filters={
              <>
                <Select value={meterId} onValueChange={(v) => { setMeterId(v); resetPage(); }}>
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
                    onChange={(e) => { setFrom(e.target.value); resetPage(); }}
                    className="w-full sm:w-40"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm font-medium text-muted-foreground">To</span>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => { setTo(e.target.value); resetPage(); }}
                    className="w-full sm:w-40"
                  />
                </div>
              </>
            }
          />

          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={readings.length === 0}
            onRetry={() => refetch()}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead {...sortHeader("meterNumber")}>
                    Meter{sortIndicator("meterNumber")}
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Unit / Property</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead {...sortHeader("readingDate")}>
                    Date{sortIndicator("readingDate")}
                  </TableHead>
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

            <ListPager meta={data?.meta} page={page} onPageChange={setPage} itemLabel="readings" />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}



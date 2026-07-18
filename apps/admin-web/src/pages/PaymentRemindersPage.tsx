import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useListQuery } from "@/hooks/use-list-query";
import { GridToolbar, GridState } from "@/components/GridToolbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, BellRing, Loader2, CheckCircle2, Mail, MessageSquare, Globe } from "lucide-react";
import {
  usePaymentReminders,
  useGenerateReminders,
  useMarkReminderSent,
  REMINDER_TYPE_LABELS,
  REMINDER_STATUS_VARIANT,
  type ReminderChannel,
  formatDate,
} from "@/hooks/use-collections";
import { ListPager } from "@/components/ListPager";

const channelIcon: Record<ReminderChannel, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  sms: <MessageSquare className="h-3.5 w-3.5" />,
  portal: <Globe className="h-3.5 w-3.5" />,
  letter: <BellRing className="h-3.5 w-3.5" />,
};

export default function PaymentRemindersPage() {
  const navigate = useNavigate();
  const listQuery = useListQuery(20);
  const { search, setSearch, page, setPage, resetPage, query, sortHeader, sortIndicator } = listQuery;
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const fullQuery = useMemo(
    () => ({
      ...query,
      ...(showOnlyPending ? { status: "pending" as const } : {}),
    }),
    [query, showOnlyPending]
  );

  const { data, isLoading, isError } = usePaymentReminders(fullQuery);
  const generate = useGenerateReminders();
  const markSent = useMarkReminderSent();

  const reminders = data?.data ?? [];

  return (
    <div className="space-y-6 flex flex-col ">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Payment Reminders</h1>
          <p className="text-muted-foreground">Automated and manual tenant reminders</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/collections" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Collections
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowOnlyPending((v) => !v)}
          >
            {showOnlyPending ? "Show All" : "Pending Only"}
          </Button>
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellRing className="mr-2 h-4 w-4" />
            )}
            Generate Overdue
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-accent" /> Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GridToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search reminders..."
          />

          <GridState
            isLoading={isLoading}
            isError={isError}
            isEmpty={reminders.length === 0}
            onRetry={() => {}}
          >
            <div className="rounded-md border scroll-grid">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead {...sortHeader("recipientName")}>
                      Recipient{sortIndicator("recipientName")}
                    </TableHead>
                    <TableHead {...sortHeader("type")}>
                      Type{sortIndicator("type")}
                    </TableHead>
                    <TableHead {...sortHeader("channel")}>
                      Channel{sortIndicator("channel")}
                    </TableHead>
                    <TableHead {...sortHeader("scheduledAt")}>
                      Scheduled{sortIndicator("scheduledAt")}
                    </TableHead>
                    <TableHead {...sortHeader("status")}>
                      Status{sortIndicator("status")}
                    </TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.recipientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {REMINDER_TYPE_LABELS[r.type] ?? r.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {channelIcon[r.channel] ?? <BellRing className="h-3.5 w-3.5" />}
                          <span className="capitalize">{r.channel}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.scheduledAt ?? r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={REMINDER_STATUS_VARIANT[r.status]}>
                          <span className="capitalize">{r.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {r.message ?? "—"}
                      </TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markSent.mutate(r.id)}
                            disabled={markSent.isPending}
                          >
                            {markSent.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                            )}
                            Mark Sent
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ListPager meta={data?.meta} page={page} onPageChange={setPage} itemLabel="reminders" />
          </GridState>
        </CardContent>
      </Card>
    </div>
  );
}

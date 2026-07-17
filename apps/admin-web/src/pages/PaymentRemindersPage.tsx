import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const channelIcon: Record<ReminderChannel, React.ReactNode> = {
  email: <Mail className="h-3.5 w-3.5" />,
  sms: <MessageSquare className="h-3.5 w-3.5" />,
  portal: <Globe className="h-3.5 w-3.5" />,
  letter: <BellRing className="h-3.5 w-3.5" />,
};

export default function PaymentRemindersPage() {
  const navigate = useNavigate();
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const { data, isLoading, isError } = usePaymentReminders(
    showOnlyPending ? { status: "pending" } : undefined
  );
  const generate = useGenerateReminders();
  const markSent = useMarkReminderSent();

  const reminders = data ?? [];

  return (
    <div className="space-y-6">
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
          {isError ? (
            <div className="py-12 text-center text-sm text-destructive">
              Failed to load reminders.
            </div>
          ) : isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <BellRing className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No reminders found.</p>
            </div>
          ) : (
            <div className="rounded-md border scroll-grid">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

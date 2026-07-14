import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BellRing,
  Mail,
  MessageSquare,
  Smartphone,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import {
  useMyReminders,
  REMINDER_TYPE_LABELS,
  REMINDER_STATUS_LABELS,
  formatDate,
  type ReminderChannel,
  type ReminderStatus,
} from "@/hooks/use-reminders";

const channelIcon: Record<ReminderChannel, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  push: <Smartphone className="h-4 w-4" />,
  letter: <BellRing className="h-4 w-4" />,
};

const statusVariant: Record<
  ReminderStatus,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  pending: "warning",
  sent: "success",
  failed: "destructive",
  cancelled: "secondary",
};

export default function PaymentRemindersPage() {
  const { data: reminders, isLoading, isError } = useMyReminders();
  const list = reminders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">Reminders</h1>
        <p className="text-muted-foreground">Notifications about your payments and balance</p>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Unable to load your reminders. Please try again later.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="border-accent/30 bg-gradient-to-br from-yellow-50 via-white to-teal-50">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="gold-gradient flex h-16 w-16 items-center justify-center rounded-2xl shadow-gold">
              <BellRing className="h-8 w-8 text-sidebar-primary-foreground" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="font-serif text-2xl font-bold">You're all caught up</h2>
              <p className="text-muted-foreground">
                No reminders right now. We'll notify you here about upcoming and overdue payments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <Card
              key={r.id}
              className={
                r.status === "pending"
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-white/5"
              }
            >
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ${
                      r.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {channelIcon[r.channel] ?? <BellRing className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {REMINDER_TYPE_LABELS[r.type] ?? r.type}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {r.channel}
                      </Badge>
                      <Badge variant={statusVariant[r.status]}>
                        {REMINDER_STATUS_LABELS[r.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.message ?? "No additional details."}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDate(r.scheduledAt ?? r.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { DollarSign, Wrench, Bell, FileText, AlertCircle, Calculator, CalendarClock, Home } from "lucide-react";
import { useMyLease, useLeasePayments } from "@/hooks/use-leases";

export default function ResidentDashboardPage() {
  const navigate = useNavigate();
  const { data: lease, isLoading: leaseLoading } = useMyLease();
  const { data: payments, isLoading: paymentsLoading } = useLeasePayments(lease?.id ?? "");

  const nextPayment = (payments ?? [])
    .filter((p) => p.status !== "paid")
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())[0];

  const leaseEnd = lease ? new Date(lease.endDate) : null;
  const today = new Date();
  const monthsRemaining = leaseEnd
    ? Math.max(0, (leaseEnd.getFullYear() - today.getFullYear()) * 12 + (leaseEnd.getMonth() - today.getMonth()))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Home</h1>
        <p className="text-muted-foreground">Your Maple Towers &middot; Unit 4B</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rent Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450</div>
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Due in 5 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">1 in progress, 1 scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lease Term</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 mo</div>
            <p className="text-xs text-muted-foreground">Remaining on lease</p>
          </CardContent>
        </Card>
      </div>

      {leaseLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-rose-50 border-rose-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">Next Payment Due</CardTitle>
              <DollarSign className="h-4 w-4 text-rose-600" />
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : nextPayment ? (
                <>
                  <div className="text-2xl font-bold text-rose-700">
                    ${nextPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {nextPayment.period ?? "Payment"} · Due {nextPayment.dueDate ? new Date(nextPayment.dueDate).toLocaleDateString() : "—"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-rose-600">No upcoming payments</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Lease End Date</CardTitle>
              <CalendarClock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">
                {leaseEnd ? leaseEnd.toLocaleDateString() : "—"}
              </div>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Home className="h-3 w-3" /> {monthsRemaining} months remaining
              </p>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Explore Mortgage</CardTitle>
              <Calculator className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-emerald-600">See what owning could cost you.</p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => navigate({ to: "/lease" })}
              >
                <Calculator className="mr-2 h-4 w-4" /> Explore Options
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: "Pool Maintenance Scheduled", date: "Jul 15, 2026", body: "The pool will be closed for maintenance on July 20th." },
              { title: "Summer BBQ Event", date: "Jul 10, 2026", body: "Join us for the annual summer BBQ in the courtyard on July 25th." },
              { title: "Parking Lot Repaving", date: "Jul 5, 2026", body: "Parking lot repaving will begin July 22-24. Please move vehicles." },
            ].map((announcement, i) => (
              <div key={i} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{announcement.title}</p>
                  <span className="text-xs text-muted-foreground">{announcement.date}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{announcement.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Request Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">HVAC Not Cooling</p>
                <p className="text-xs text-muted-foreground">Submitted Jul 12, 2026</p>
              </div>
              <Badge variant="warning">In Progress</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Kitchen Faucet Leak</p>
                <p className="text-xs text-muted-foreground">Submitted Jul 8, 2026</p>
              </div>
              <Badge variant="default">Scheduled</Badge>
            </div>
            <Button variant="outline" className="w-full">Submit New Request</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

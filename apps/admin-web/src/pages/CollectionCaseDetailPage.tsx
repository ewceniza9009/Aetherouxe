import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  FolderOpen,
  Loader2,
  Plus,
  CalendarClock,
  User,
  AlertTriangle,
} from "lucide-react";
import {
  useCollectionCase,
  useAddCaseNote,
  useAddCaseActivity,
  CASE_STATUS_VARIANT,
  CASE_STATUS_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_PRIORITY_LABELS,
  formatCurrency,
  formatDate,
} from "@/hooks/use-collections";

export default function CollectionCaseDetailPage() {
  const { id } = useParams({ from: "/protected/collections/cases/$id" });
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCollectionCase(id);

  const [note, setNote] = useState("");
  const addNote = useAddCaseNote();
  const submitNote = async () => {
    if (!note.trim()) return;
    await addNote.mutateAsync({ caseId: id, note: note.trim() });
    setNote("");
  };

  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState("call");
  const [activityOutcome, setActivityOutcome] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [activityNotes, setActivityNotes] = useState("");
  const addActivity = useAddCaseActivity();
  const submitActivity = async () => {
    await addActivity.mutateAsync({
      caseId: id,
      type: activityType,
      outcome: activityOutcome || undefined,
      date: activityDate || undefined,
      notes: activityNotes || undefined,
    });
    setActivityOpen(false);
    setActivityOutcome("");
    setActivityDate("");
    setActivityNotes("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate({ to: "/collections/cases" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cases
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Unable to load this collection case.
          </CardContent>
        </Card>
      </div>
    );
  }

  const notes = data.notes ?? [];
  const activities = data.activities ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              {data.caseNumber}
            </h1>
            <Badge variant={CASE_PRIORITY_VARIANT[data.priority]}>
              {CASE_PRIORITY_LABELS[data.priority]}
            </Badge>
            <Badge variant={CASE_STATUS_VARIANT[data.status]}>
              {CASE_STATUS_LABELS[data.status]}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground flex items-center gap-1">
            <User className="h-4 w-4" /> {data.tenantName}
            {data.leaseNumber ? ` · Lease ${data.leaseNumber}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate({ to: "/collections/cases" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cases
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Total Outstanding" value={formatCurrency(data.outstandingAmount)} tone="text-rose-700" />
        <SummaryCard
          title="Opened"
          value={formatDate(data.openedAt ?? data.createdAt)}
        />
        <SummaryCard title="Last Activity" value={formatDate(data.lastActivityAt)} />
        <SummaryCard
          title="Next Action"
          value={formatDate(data.nextActionDate)}
          icon={<CalendarClock className="h-4 w-4 text-orange-600" />}
        />
      </div>

      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">
            Activities {activities.length > 0 && `(${activities.length})`}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes {notes.length > 0 && `(${notes.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-accent" /> Activity Timeline
                </CardTitle>
                <Button size="sm" onClick={() => setActivityOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No activities recorded yet.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-4 pl-4">
                  <div className="absolute left-1 top-1 bottom-1 w-px bg-border" />
                  {activities.map((a) => (
                    <div key={a.id} className="relative">
                      <span className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{a.type.replace(/_/g, " ")}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(a.date ?? a.createdAt)}
                          </span>
                        </div>
                        {a.outcome && (
                          <p className="mt-1 text-sm">
                            <span className="text-muted-foreground">Outcome: </span>
                            {a.outcome}
                          </p>
                        )}
                        {a.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">{a.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-accent" /> Case Notes
              </CardTitle>
              <CardDescription>Internal notes visible to staff only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNote();
                  }}
                />
                <Button
                  onClick={submitNote}
                  disabled={addNote.isPending || !note.trim()}
                >
                  {addNote.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
              <Separator />
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No notes yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3">
                      <p className="text-sm">{n.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.authorName ?? "Staff"} · {formatDate(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>Log a collection touchpoint for this case.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atype">Type</Label>
              <Input
                id="atype"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                placeholder="call, email, letter, visit..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adate">Date</Label>
              <Input
                id="adate"
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aoutcome">Outcome</Label>
              <Input
                id="aoutcome"
                value={activityOutcome}
                onChange={(e) => setActivityOutcome(e.target.value)}
                placeholder="Promise to pay, no answer..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anotes">Notes</Label>
              <Input
                id="anotes"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitActivity} disabled={addActivity.isPending}>
              {addActivity.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ?? <FolderOpen className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

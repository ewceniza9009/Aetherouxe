import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@elite-realty/shared-ui/components/ui';
import { Badge } from '@elite-realty/shared-ui/components/ui';
import { Button } from '@elite-realty/shared-ui/components/ui';
import { Input } from '@elite-realty/shared-ui/components/ui';
import { Label } from '@elite-realty/shared-ui/components/ui';
import { Textarea } from '@elite-realty/shared-ui/components/ui';
import { Skeleton } from '@elite-realty/shared-ui/components/ui';
import { Separator } from '@elite-realty/shared-ui/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@elite-realty/shared-ui/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@elite-realty/shared-ui/components/ui';
import { Wrench, Plus, Loader2, AlertCircle, Inbox } from 'lucide-react';
import {
  useMyServiceRequests,
  useCreateServiceRequest,
  SERVICE_CATEGORY_STYLES,
  SERVICE_PRIORITY_STYLES,
  SERVICE_STATUS_STYLES,
  formatDate,
  type ServiceCategory,
  type ServicePriority,
  type ServiceRequest,
  type ServiceStatus,
} from '@/hooks/use-resident-portal';

const STATUS_FLOW: ServiceStatus[] = ['submitted', 'in_progress', 'scheduled', 'completed'];

function StatusTracker({ status }: { status: ServiceStatus }) {
  if (status === 'cancelled') {
    return <p className="text-xs font-medium text-gray-500">Cancelled</p>;
  }
  const currentIndex = STATUS_FLOW.indexOf(status === 'on_hold' ? 'in_progress' : status);
  return (
    <div className="flex items-center gap-1.5">
      {STATUS_FLOW.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${done ? 'bg-primary' : 'bg-muted-foreground/25'} ${
                isCurrent ? 'ring-2 ring-primary/30' : ''
              }`}
            />
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={`h-0.5 w-5 ${i < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewRequestDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ServiceCategory | ''>('');
  const [priority, setPriority] = useState<ServicePriority>('medium');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const createRequest = useCreateServiceRequest();

  const reset = () => {
    setCategory('');
    setPriority('medium');
    setDescription('');
    setUnit('');
  };

  const handleSubmit = async () => {
    if (!category || !description.trim()) return;
    await createRequest.mutateAsync({
      category,
      priority,
      description: description.trim(),
      unitId: unit || undefined,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> New Request
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a Service Request</DialogTitle>
          <DialogDescription>Report a maintenance issue for your home.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_CATEGORY_STYLES) as ServiceCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {SERVICE_CATEGORY_STYLES[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ServicePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SERVICE_PRIORITY_STYLES) as ServicePriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {SERVICE_PRIORITY_STYLES[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit / Property (optional)</Label>
            <Input
              id="unit"
              placeholder="e.g., Unit 4B"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!category || !description.trim() || createRequest.isPending}
          >
            {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestRow({ req }: { req: ServiceRequest }) {
  const category = SERVICE_CATEGORY_STYLES[req.category];
  const priority = SERVICE_PRIORITY_STYLES[req.priority];
  const status = SERVICE_STATUS_STYLES[req.status];
  const accent =
    req.status === 'completed'
      ? 'border-l-emerald-500'
      : req.status === 'cancelled'
        ? 'border-l-gray-400'
        : req.status === 'on_hold'
          ? 'border-l-amber-500'
          : 'border-l-primary';

  return (
    <div className={`p-4 rounded-lg border border-l-4 ${accent} hover:bg-muted/30`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{req.description}</p>
              <Badge variant="outline" className={category.className}>
                {category.label}
              </Badge>
              <Badge variant="outline" className={priority.className}>
                {priority.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {req.id} &middot; {req.unitLabel || req.propertyName || 'My residence'} &middot;
              Requested {formatDate(req.requestedDate ?? req.createdAt)}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </div>
      <Separator className="my-3" />
      <StatusTracker status={req.status} />
    </div>
  );
}

function RequestSkeleton() {
  return (
    <div className="p-4 rounded-lg border space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-2 w-40" />
    </div>
  );
}

export default function ServiceRequestsPage() {
  const { data: requests, isLoading, isError } = useMyServiceRequests();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground">Submit and track maintenance requests</p>
        </div>
        <NewRequestDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>
            Track the progress of each request from submission to completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <RequestSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="font-medium">Unable to load requests</p>
              <p className="text-sm text-muted-foreground">Please try again later.</p>
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Inbox className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">No service requests</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Need something fixed? Submit a new request and our team will take it from there.
              </p>
              <NewRequestDialog />
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <RequestRow key={req.id} req={req} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

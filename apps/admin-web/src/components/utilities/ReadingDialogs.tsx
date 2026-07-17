import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2 } from "lucide-react";
import {
  useCreateReading,
  useUpdateReading,
  useBulkReadings,
  type UtilityMeter,
  type ConsumptionReading,
} from "@/hooks/use-utilities";

export function AddReadingDialog({
  meters,
  defaultMeterId,
  trigger,
}: {
  meters: UtilityMeter[];
  defaultMeterId?: string;
  trigger?: React.ReactNode;
}) {
  const createReading = useCreateReading();
  const [open, setOpen] = useState(false);
  const [meterId, setMeterId] = useState(defaultMeterId ?? "");
  const [readingDate, setReadingDate] = useState("");
  const [value, setValue] = useState("");
  const [reader, setReader] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setMeterId(defaultMeterId ?? "");
    setReadingDate("");
    setValue("");
    setReader("");
    setNote("");
  };

  const submit = async () => {
    await createReading.mutateAsync({
      meterId,
      readingDate,
      value: parseFloat(value),
      reader: reader || undefined,
      note: note || undefined,
    });
    setOpen(false);
    reset();
  };

  const canSubmit = meterId && readingDate && value !== "";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Reading
      </Button>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Consumption Reading</DialogTitle>
          <DialogDescription>Record a meter reading for a billing period.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meter">Meter</Label>
            <Select value={meterId} onValueChange={setMeterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select meter" />
              </SelectTrigger>
              <SelectContent>
                {meters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.meterNumber} · {m.utilityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Reading Date</Label>
              <Input id="date" type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reader">Reader (optional)</Label>
            <Input id="reader" value={reader} onChange={(e) => setReader(e.target.value)} placeholder="Meter reader name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Remarks" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || createReading.isPending}>
            {createReading.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Save Reading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface BulkReadingRow {
  meterId: string;
  readingDate: string;
  value: string;
}

export function BulkReadingsDialog({
  meters,
  trigger,
}: {
  meters: UtilityMeter[];
  trigger?: React.ReactNode;
}) {
  const bulk = useBulkReadings();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BulkReadingRow[]>([
    { meterId: meters[0]?.id ?? "", readingDate: "", value: "" },
  ]);

  const reset = () => setRows([{ meterId: meters[0]?.id ?? "", readingDate: "", value: "" }]);

  const setRow = (idx: number, patch: Partial<BulkReadingRow>) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const addRow = () =>
    setRows((prev) => [...prev, { meterId: meters[0]?.id ?? "", readingDate: "", value: "" }]);

  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    const readings = rows
      .filter((r) => r.meterId && r.readingDate && r.value !== "")
      .map((r) => ({
        meterId: r.meterId,
        readingDate: r.readingDate,
        value: parseFloat(r.value),
      }));
    if (readings.length === 0) return;
    await bulk.mutateAsync({ readings });
    setOpen(false);
    reset();
  };

  const canSubmit = rows.some((r) => r.meterId && r.readingDate && r.value !== "");

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Bulk Add
      </Button>
      {trigger}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Add Readings</DialogTitle>
          <DialogDescription>Enter multiple meter readings at once.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_140px_120px_40px] gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span>Meter</span>
            <span>Date</span>
            <span>Value</span>
            <span />
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_140px_120px_40px] items-center gap-2">
                <Select value={row.meterId} onValueChange={(v) => setRow(idx, { meterId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Meter" />
                  </SelectTrigger>
                  <SelectContent>
                    {meters.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.meterNumber} · {m.utilityType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={row.readingDate} onChange={(e) => setRow(idx, { readingDate: e.target.value })} />
                <Input
                  type="number"
                  step="0.01"
                  value={row.value}
                  onChange={(e) => setRow(idx, { value: e.target.value })}
                  placeholder="0.00"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(idx)}
                  disabled={rows.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addRow} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Row
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit || bulk.isPending}>
            {bulk.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Save {rows.filter((r) => r.meterId && r.readingDate && r.value !== "").length} Readings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditReadingDialog({
  reading,
  trigger,
}: {
  reading: ConsumptionReading;
  trigger?: React.ReactNode;
}) {
  const updateReading = useUpdateReading();
  const [open, setOpen] = useState(false);
  const [readingDate, setReadingDate] = useState(
    reading.readingDate ? new Date(reading.readingDate).toISOString().split("T")[0] : ""
  );
  const [value, setValue] = useState(String(reading.value ?? ""));
  const [reader, setReader] = useState(reading.reader ?? "");
  const [note, setNote] = useState(reading.note ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingDate || !value) return;

    await updateReading.mutateAsync({
      id: reading.id,
      readingDate: new Date(readingDate).toISOString(),
      value: Number(value),
      reader: reader || null,
      note: note || null,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reading</DialogTitle>
          <DialogDescription>Modify the consumption reading</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-readingDate">Date</Label>
              <Input
                id="edit-readingDate"
                type="date"
                required
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Reading Value</Label>
              <Input
                id="edit-value"
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-reader">Reader (Optional)</Label>
            <Input
              id="edit-reader"
              value={reader}
              onChange={(e) => setReader(e.target.value)}
              placeholder="e.g. John Doe, Smart Meter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-note">Note (Optional)</Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any notes or anomalies"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateReading.isPending}>
              {updateReading.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

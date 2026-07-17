import { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  includeTime?: boolean;
  className?: string;
  id?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  includeTime = false,
  className,
  id,
}: DatePickerProps) {
  const selected = toDate(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(selected ?? new Date());
  const [time, setTime] = useState(
    selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : "00:00"
  );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = startOfDay(new Date());

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function commit(day: Date) {
    const iso = includeTime
      ? `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${time}:00`
      : `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
    onChange(iso);
    if (!includeTime) setOpen(false);
  }

  function shiftMonth(delta: number) {
    setView(new Date(year, month + delta, 1));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span>{selected ? formatDisplay(selected, includeTime) : placeholder}</span>
          <Calendar className="h-4 w-4 text-primary/80" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex items-center justify-between pb-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold gold-text">
            {MONTHS[month]} {year}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-[10px] font-medium uppercase text-muted-foreground">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const isSel = selected ? sameDay(day, selected) : false;
            const isToday = sameDay(day, today);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => commit(day)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
                  isSel
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-foreground hover:bg-primary/15",
                  !isSel && isToday && "ring-1 ring-inset ring-primary/50"
                )}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {includeTime && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
            <Clock className="h-4 w-4 text-primary/80" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" className="gold-gradient text-black" onClick={() => selected && commit(selected)}>
              Set
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDisplay(d: Date, includeTime: boolean) {
  const base = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (includeTime) return `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return base;
}

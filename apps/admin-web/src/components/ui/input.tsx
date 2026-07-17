import { forwardRef } from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const DATE_TYPES = ["date", "datetime-local", "month", "week"];
const TIME_TYPES = ["time"];

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDate = type ? DATE_TYPES.includes(type) : false;
    const isTime = type ? TIME_TYPES.includes(type) : false;

    const inputEl = (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          (isDate || isTime) && "date-input pr-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (isDate || isTime) {
      const Icon = isTime ? Clock : Calendar;
      return (
        <div className="relative w-full">
          {inputEl}
          <Icon
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/80"
            aria-hidden="true"
          />
        </div>
      );
    }

    return inputEl;
  }
);
Input.displayName = "Input";

export { Input };

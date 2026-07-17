import { forwardRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput, QuantityInput, NumberInput } from "@/components/ui/number-input";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const DATE_TYPES = ["date", "datetime-local", "month", "week"];
const TIME_TYPES = ["time"];
const NUMBER_TYPES = ["number"];

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, step, ...props }, ref) => {
    const isDate = type ? DATE_TYPES.includes(type) : false;
    const isTime = type ? TIME_TYPES.includes(type) : false;
    const isNumber = type ? NUMBER_TYPES.includes(type) : false;

    if (isDate) {
      const handleChange = onChange as ((e: { target: { value: string } }) => void) | undefined;
      return (
        <DatePicker
          value={typeof value === "string" ? value : undefined}
          includeTime={type === "datetime-local"}
          onChange={(v) => handleChange?.({ target: { value: v } } as any)}
          className={className}
          {...(props as any)}
        />
      );
    }

    if (isNumber) {
      const stepStr = step !== undefined ? String(step) : "";
      const hasDecimalStep = stepStr !== "" && stepStr.includes(".");
      const decimals = hasDecimalStep ? stepStr.split(".")[1].length : 2;
      // Explicit money markers: data-amount attribute OR step="0.01".
      const isAmount =
        (props as any)["data-amount"] === "true" ||
        (props as any)["data-amount"] === true ||
        stepStr === "0.01";
      // Whole-number step (e.g. step="1") → integer quantity, no decimals.
      const isQuantity = stepStr !== "" && !hasDecimalStep && !isAmount;
      const handleChange = onChange as ((e: { target: { value: string } }) => void) | undefined;

      if (isQuantity) {
        return (
          <QuantityInput
            value={value === undefined || value === null ? "" : (value as string | number)}
            onChange={(raw) => handleChange?.({ target: { value: raw } } as any)}
            className={className}
            {...(props as any)}
          />
        );
      }

      if (isAmount) {
        return (
          <AmountInput
            value={value === undefined || value === null ? "" : (value as string | number)}
            onChange={(raw) => handleChange?.({ target: { value: raw } } as any)}
            className={className}
            {...(props as any)}
          />
        );
      }

      // Default: masked number with decimals (no ₱). Best of both worlds.
      return (
        <NumberInput
          value={value === undefined || value === null ? "" : (value as string | number)}
          decimals={decimals}
          onChange={(raw) => handleChange?.({ target: { value: raw } } as any)}
          className={className}
          {...(props as any)}
        />
      );
    }

    const inputEl = (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isTime && "date-input pr-10",
          className
        )}
        ref={ref}
        value={value}
        onChange={onChange}
        step={step}
        {...props}
      />
    );

    if (isTime) {
      return (
        <div className="relative w-full">
          {inputEl}
          <Clock
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

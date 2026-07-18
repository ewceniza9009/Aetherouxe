import { forwardRef } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput, QuantityInput, NumberInput } from "@/components/ui/number-input";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const DATE_TYPES = ["date", "datetime-local", "month", "week"];
const TIME_TYPES = ["time"];
const NUMBER_TYPES = ["number"];

interface DataAmountProps {
  "data-amount"?: boolean | string;
}

function getDataAmount(props: React.InputHTMLAttributes<HTMLInputElement>): boolean | string | undefined {
  const dataProps = props as React.InputHTMLAttributes<HTMLInputElement> & DataAmountProps;
  return dataProps["data-amount"];
}

function makeChangeHandler(onChange: React.InputHTMLAttributes<HTMLInputElement>["onChange"]): (v: string) => void {
  return (v: string) => {
    if (typeof onChange === "function") {
      const handler = onChange as (e: { target: { value: string } }) => void;
      handler({ target: { value: v } });
    }
  };
}

function extraPropsFromInput(props: React.InputHTMLAttributes<HTMLInputElement>): Record<string, unknown> {
  const { className: _c, type: _t, value: _v, onChange: _o, step: _s, ...rest } = props;
  return rest as Record<string, unknown>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, step, ...props }, ref) => {
    const isDate = type ? DATE_TYPES.includes(type) : false;
    const isTime = type ? TIME_TYPES.includes(type) : false;
    const isNumber = type ? NUMBER_TYPES.includes(type) : false;
    const handleChange = makeChangeHandler(onChange);
    const allExtraProps = extraPropsFromInput({ className, type, value, onChange, step, ...props });

    if (isDate) {
      return (
        <DatePicker
          value={typeof value === "string" ? value : undefined}
          includeTime={type === "datetime-local"}
          onChange={handleChange}
          className={className}
          {...allExtraProps}
        />
      );
    }

    if (isNumber) {
      const stepStr = step !== undefined ? String(step) : "";
      const hasDecimalStep = stepStr !== "" && stepStr.includes(".");
      const decimals = hasDecimalStep ? stepStr.split(".")[1].length : 2;
      const isAmount =
        getDataAmount(props) === "true" ||
        getDataAmount(props) === true ||
        stepStr === "0.01";
      const isQuantity = stepStr !== "" && !hasDecimalStep && !isAmount;

      if (isQuantity) {
        return (
          <QuantityInput
            value={value === undefined || value === null ? "" : (value as string | number)}
            onChange={handleChange}
            className={className}
            {...allExtraProps}
          />
        );
      }

      if (isAmount) {
        return (
          <AmountInput
            value={value === undefined || value === null ? "" : (value as string | number)}
            onChange={handleChange}
            className={className}
            {...allExtraProps}
          />
        );
      }

      return (
        <NumberInput
          value={value === undefined || value === null ? "" : (value as string | number)}
          decimals={decimals}
          onChange={handleChange}
          className={className}
          {...allExtraProps}
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

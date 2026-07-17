import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getCurrencyMeta } from "@/lib/settings-store";

interface NumberInputProps {
  value: string | number;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  decimals: number;
  prefix?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

function groupThousands(intPart: string): string {
  if (intPart === "") return "";
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function stripNonNumeric(raw: string): string {
  let hasDot = false;
  let out = "";
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") out += ch;
    else if (ch === "." && !hasDot) {
      out += ".";
      hasDot = true;
    }
  }
  return out;
}

function stripLeadingZeros(intPart: string): string {
  if (intPart === "") return "";
  const stripped = intPart.replace(/^0+(?=\d)/, "");
  return stripped;
}

function formatNumber(valStr: string, decimals: number): string {
  if (valStr === "" || valStr === ".") return "";
  const leadingDot = valStr.startsWith(".");
  const [intRaw, frac] = valStr.split(".");
  const intPart = stripLeadingZeros(intRaw || "");
  const intOut = intPart === "" ? (leadingDot ? "0" : "") : groupThousands(intPart);
  if (frac !== undefined) {
    return `${intOut === "" ? "0" : intOut}.${frac.slice(0, decimals)}`;
  }
  return intOut;
}

function NumberInputBase({
  value,
  onChange,
  onBlur,
  placeholder,
  decimals,
  prefix,
  className,
  id,
  disabled,
}: NumberInputProps) {
  const [display, setDisplay] = useState("");
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    const str = value === "" || value === null || value === undefined ? "" : String(value);
    setDisplay(formatNumber(str, decimals));
  }, [value, decimals]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = stripNonNumeric(e.target.value);
    setDisplay(formatNumber(cleaned, decimals));
    onChange(cleaned === "" || cleaned === "." ? "" : cleaned);
  }, [decimals, onChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    focused.current = true;
    requestAnimationFrame(() => {
      e.target.select();
    });
  }, []);

  const handleBlur = useCallback(() => {
    focused.current = false;
    setDisplay((d) => formatNumber(stripNonNumeric(d), decimals));
    onBlur?.();
  }, [decimals, onBlur]);

  return (
    <div className={cn("relative flex items-center", className)}>
      {prefix && (
        <span className="pointer-events-none absolute left-3 text-sm font-medium text-primary/80">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm tabular-nums ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          prefix ? "pl-7 pr-3" : "px-3"
        )}
      />
    </div>
  );
}

interface AmountInputProps {
  value: string | number;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function AmountInput({ value, onChange, onBlur, placeholder, disabled, className, id }: AmountInputProps) {
  const { symbol } = getCurrencyMeta();
  return (
    <NumberInputBase
      id={id}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      decimals={2}
      prefix={symbol || undefined}
      className={className}
      disabled={disabled}
    />
  );
}

interface QuantityInputProps {
  value: string | number;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function QuantityInput({ value, onChange, onBlur, placeholder, disabled, className, id }: QuantityInputProps) {
  return (
    <NumberInputBase
      id={id}
      value={value}
      onChange={(raw) => onChange(raw === "" ? "" : raw.split(".")[0])}
      onBlur={onBlur}
      placeholder={placeholder}
      decimals={0}
      className={className}
      disabled={disabled}
    />
  );
}

interface PlainNumberInputProps {
  value: string | number;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  decimals?: number;
  className?: string;
  id?: string;
}

export function NumberInput(props: PlainNumberInputProps) {
  return <NumberInputBase {...props} decimals={props.decimals ?? 2} />;
}

interface CurrencyInputProps {
  value: string | number;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CurrencyInput(props: CurrencyInputProps) {
  return <AmountInput {...props} />;
}

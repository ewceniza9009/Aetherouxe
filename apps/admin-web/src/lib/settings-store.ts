import api from "./api";

export interface CurrencyMeta {
  code: string;
  symbol: string;
}

let currencyMeta: CurrencyMeta = { code: "PHP", symbol: "₱" };

export function getCurrencyMeta(): CurrencyMeta {
  return currencyMeta;
}

export function setCurrencyMeta(meta: Partial<CurrencyMeta>): void {
  currencyMeta = {
    code: meta.code ?? currencyMeta.code,
    symbol: meta.symbol ?? currencyMeta.symbol,
  };
}

let bootstrapPromise: Promise<void> | null = null;

export function bootstrapSettings(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      const res = await api.get("/settings/company");
      const data = res.data?.data ?? res.data;
      if (data && (data.currency || data.currencySymbol)) {
        setCurrencyMeta({ code: data.currency, symbol: data.currencySymbol });
      }
    } catch {
      // Keep defaults if unauthenticated or unavailable.
    }
  })();
  return bootstrapPromise;
}

export function formatCurrency(value?: number | string | null): string {
  if (value === undefined || value === null) return "—";
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numericValue)) return "—";
  
  const { code, symbol } = getCurrencyMeta();
  const num = numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
  if (symbol) return `${symbol}${num}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${code} ${num}`;
  }
}

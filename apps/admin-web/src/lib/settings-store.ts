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

export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const { code, symbol } = getCurrencyMeta();
  const num = value.toLocaleString("en-US", {
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
    }).format(value);
  } catch {
    return `${code} ${num}`;
  }
}

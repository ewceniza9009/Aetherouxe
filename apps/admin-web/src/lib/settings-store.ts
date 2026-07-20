import { api } from '@elite-realty/shared-ui/lib/api';

export interface CurrencyMeta {
  code: string;
  symbol: string;
}

export interface CompanyMeta {
  name?: string;
  logoUrl?: string;
}

let currencyMeta: CurrencyMeta = { code: 'PHP', symbol: '₱' };
let companyMeta: CompanyMeta = { name: 'Aetherouxe Estates' };

export function getCurrencyMeta(): CurrencyMeta {
  return currencyMeta;
}

export function setCurrencyMeta(meta: Partial<CurrencyMeta>): void {
  currencyMeta = {
    code: meta.code ?? currencyMeta.code,
    symbol: meta.symbol ?? currencyMeta.symbol,
  };
}

import { useState, useEffect } from 'react';

export function getCompanyMeta(): CompanyMeta {
  return companyMeta;
}

export function setCompanyMeta(meta: Partial<CompanyMeta>): void {
  companyMeta = {
    name: meta.name ?? companyMeta.name,
    logoUrl: meta.logoUrl ?? companyMeta.logoUrl,
  };
  window.dispatchEvent(new Event('company-meta-updated'));
}

export function useCompanyMeta() {
  const [meta, setMeta] = useState(companyMeta);
  useEffect(() => {
    const handler = () => setMeta(companyMeta);
    window.addEventListener('company-meta-updated', handler);
    return () => window.removeEventListener('company-meta-updated', handler);
  }, []);
  return meta;
}

let bootstrapPromise: Promise<void> | null = null;

export function reloadSettings(): Promise<void> {
  bootstrapPromise = null;
  return bootstrapSettings();
}

export function bootstrapSettings(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      const res = await api.get('/settings/company');
      const data = res.data?.data ?? res.data;
      if (data && (data.currency || data.currencySymbol)) {
        setCurrencyMeta({ code: data.currency, symbol: data.currencySymbol });
      }
      if (data && data.company) {
        setCompanyMeta({
          name: data.company.tradeName || data.company.legalName || 'Aetherouxe Estates',
          logoUrl: data.branding?.logoUrl,
        });
      }
    } catch {
      // Keep defaults if unauthenticated or unavailable.
    }
  })();
  return bootstrapPromise;
}

export function formatCurrency(value?: number | string | null): string {
  if (value === undefined || value === null) return '—';
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numericValue)) return '—';

  const { code, symbol } = getCurrencyMeta();
  const num = numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
  if (symbol) return `${symbol}${num}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${code} ${num}`;
  }
}

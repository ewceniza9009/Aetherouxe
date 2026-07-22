import type { UtilityType, UtilityBillStatus } from '@/hooks/use-utilities';

const defaultUtilityMeta = {
  label: 'Utility',
  className: 'bg-gray-100 text-gray-800 border-transparent',
  icon: 'Droplets',
};
const defaultStatusMeta = {
  label: 'Pending',
  className: 'bg-yellow-100 text-yellow-800 border-transparent',
};

export const utilityTypeMeta: Record<string, { label: string; className: string; icon: string }> =
  new Proxy(
    {
      water: {
        label: 'Water',
        className: 'bg-blue-100 text-blue-800 border-transparent',
        icon: 'Droplets',
      },
      electricity: {
        label: 'Electricity',
        className: 'bg-yellow-100 text-yellow-800 border-transparent',
        icon: 'Zap',
      },
      gas: {
        label: 'Gas',
        className: 'bg-orange-100 text-orange-800 border-transparent',
        icon: 'Flame',
      },
    },
    {
      get: (
        target: Record<string, { label: string; className: string; icon: string }>,
        prop: string,
      ) => target[prop] ?? defaultUtilityMeta,
    },
  );

export const billStatusMeta: Record<string, { label: string; className: string }> = new Proxy(
  {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-transparent' },
    paid: { label: 'Paid', className: 'bg-green-100 text-green-800 border-transparent' },
    partially_paid: {
      label: 'Partially Paid',
      className: 'bg-blue-100 text-blue-800 border-transparent',
    },
    waived: { label: 'Waived', className: 'bg-slate-100 text-slate-700 border-transparent' },
    disputed: { label: 'Disputed', className: 'bg-red-100 text-red-800 border-transparent' },
  },
  {
    get: (target: Record<string, { label: string; className: string }>, prop: string) =>
      target[prop] ?? defaultStatusMeta,
  },
);

export function money(n: number | null | undefined): string {
  return `$${Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

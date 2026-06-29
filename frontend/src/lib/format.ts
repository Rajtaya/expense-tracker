import { format, parseISO } from 'date-fns';

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'd MMM yyyy');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

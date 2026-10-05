import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount in minor units for display, e.g. 129900 → "£1,299.00". */
export function formatMoney(minor: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(minor / 100);
}

export function pluralise<T extends string>(count: number, one: T, many: string): string {
  return count === 1 ? `${count} ${one}` : `${count} ${many}`;
}

export const isBrowser = typeof window !== 'undefined';

'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn, formatMoney } from '@/lib/utils';

type Status = 'paid' | 'due' | 'overdue';

interface Invoice {
  id: string;
  customer: string;
  issued: string;
  amount: number;
  status: Status;
}

// Sample rows from the Leith shop's March run, shown with the owner's permission.
const rows: Invoice[] = [
  { id: 'INV-0412', customer: 'Trinity Academy library', issued: '2026-03-02', amount: 48250, status: 'paid' },
  { id: 'INV-0413', customer: 'Thursday Night Book Club', issued: '2026-03-05', amount: 6400, status: 'due' },
  { id: 'INV-0414', customer: 'Leith Primary School', issued: '2026-02-11', amount: 129900, status: 'overdue' },
];

const statusLabel: Record<Status, string> = { paid: 'Paid', due: 'Due', overdue: 'Overdue' };

function sortBy<T, K extends keyof T>(items: readonly T[], key: K, dir: 'asc' | 'desc'): T[] {
  return [...items].sort((a, b) => {
    const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return dir === 'asc' ? order : -order;
  });
}

const useSorted = <T,>(items: readonly T[], key: keyof T) => {
  const [dir, setDir] = React.useState<'asc' | 'desc'>('desc');
  const sorted = React.useMemo(() => sortBy(items, key, dir), [items, key, dir]);
  return { sorted, dir, toggle: () => setDir((d) => (d === 'asc' ? 'desc' : 'asc')) };
};

export function InvoiceTable({ className }: { className?: string }) {
  const { sorted, dir, toggle } = useSorted(rows, 'amount');
  const total = sorted.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className={cn('mt-6 overflow-x-auto rounded-lg border', className)}>
      <table className="w-full text-sm">
        <caption className="sr-only">Invoices from one run, {sorted.length} rows</caption>
        <thead className="bg-muted/50 text-left">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Invoice</th>
            <th scope="col" className="px-4 py-3 font-medium">Customer</th>
            <th scope="col" className="px-4 py-3 font-medium">Issued</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              <button type="button" onClick={toggle} className="inline-flex items-center gap-1 rounded-sm hover:text-foreground">
                Amount {dir === 'asc' ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                <span className="sr-only">{`sorted ${dir === 'asc' ? 'ascending' : 'descending'}`}</span>
              </button>
            </th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className={cn('border-t', r.status === 'overdue' && 'bg-destructive/5')}>
              <td className="px-4 py-3 font-mono">{r.id}</td>
              <td className="px-4 py-3">{r.customer}</td>
              <td className="px-4 py-3 tabular-nums">{r.issued}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.amount)}</td>
              <td className="px-4 py-3">
                <Badge variant={r.status === 'overdue' ? 'destructive' : r.status === 'paid' ? 'secondary' : 'outline'}>{statusLabel[r.status]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-medium">
            <td className="px-4 py-3" colSpan={3}>Total for 3 invoices</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatMoney(total)}</td>
            <td className="px-4 py-3">12% up on February, 2.5x the January run</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

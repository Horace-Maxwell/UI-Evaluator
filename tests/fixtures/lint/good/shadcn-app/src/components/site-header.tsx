'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const nav = [
  { href: '/invoices', label: 'Invoices' },
  { href: '/payouts', label: 'Payouts' },
  { href: '/customers', label: 'Customers' },
  { href: '/settings', label: 'Settings' },
];

function Logo() {
  // The brand mark is artwork: its colours come from the logo file, not the UI palette.
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="2" y="2" width="24" height="24" rx="4" fill="#2f6f5e" />
      <path d="M8 8v12h12" stroke="#f2f7f5" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') {
      window.location.assign(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo />
          <span>Ledgerline</span>
        </Link>
        <nav aria-label="Main" className="hidden gap-4 text-sm md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-sm text-muted-foreground transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-keyshortcuts="Meta+K">
            <Search aria-hidden="true" />
            Search invoices
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" aria-expanded={false}>
            <Menu aria-hidden="true" />
          </Button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search invoices</DialogTitle>
            <DialogDescription>Search by invoice number, customer or amount.</DialogDescription>
          </DialogHeader>
          <label htmlFor="invoice-search" className="text-sm font-medium">
            Invoice, customer or amount
          </label>
          <Input
            id="invoice-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="INV-0412 or Trinity Academy"
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}

import Link from 'next/link';
import { ArrowUpRight, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceTable } from '@/components/invoice-table';
import { SiteHeader } from '@/components/site-header';

const steps = [
  { title: 'Import your stock list', body: 'Upload the CSV your till already exports; Ledgerline keeps ISBNs and prices.' },
  { title: 'Invoice schools and book clubs', body: 'Each invoice carries your shop details, VAT number and the payment link.' },
  { title: 'Reconcile card takings', body: 'Match card payouts to sales every evening instead of every quarter.' },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-6 py-16">
        <section aria-labelledby="intro-title" className="grid gap-8 md:grid-cols-[3fr_2fr] md:items-end">
          <div className="space-y-4">
            <h1 id="intro-title" className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Invoices and payouts for independent bookshops
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              Ledgerline sends invoices to schools and book clubs, chases the late ones politely, and matches card
              payouts to your till so the quarter-end count takes an afternoon.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Open a shop account</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/demo">
                  Watch a 3-minute walkthrough <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <figure className="rounded-lg border bg-card p-4">
            <img src="/screens/invoice-list.png" alt="The invoice list with three overdue invoices highlighted" width={640} height={420} />
            <figcaption className="mt-2 text-sm text-muted-foreground">The invoice list from the Leith shop, used with permission.</figcaption>
          </figure>
        </section>

        <section aria-labelledby="how-title" className="mt-20">
          <h2 id="how-title" className="text-2xl font-semibold">How a week with Ledgerline goes</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <Card className="h-full">
                  <CardHeader>
                    <span className="font-mono text-sm text-muted-foreground">Step {i + 1}</span>
                    <CardTitle>{step.title}</CardTitle>
                    <CardDescription>{step.body}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="proof-title" className="mt-20 grid gap-6 md:grid-cols-2">
          <h2 id="proof-title" className="sr-only">From shops using it</h2>
          <blockquote className="border-l-4 border-primary pl-4">
            <p className="text-lg">We used to spend the first week of every quarter matching card slips. Now it is a Tuesday afternoon.</p>
            <footer className="mt-2 text-sm text-muted-foreground">— Morag Lindsay, Lindsay &amp; Daughters Books, Leith</footer>
          </blockquote>
          <p className="text-lg">
            Used by 140 independent bookshops across Scotland and the north of England since 2021.
          </p>
        </section>

        <section aria-labelledby="recent-title" className="mt-20">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="recent-title" className="text-2xl font-semibold">What an invoice run looks like</h2>
          </div>
          <InvoiceTable />
        </section>
      </main>
    </>
  );
}

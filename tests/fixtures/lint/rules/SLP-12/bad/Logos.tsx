const customers = ['Stripe', 'Vercel', 'Linear', 'Notion']; // expect: SLP-12

const testimonials = [
  { quote: 'The best planning tool we have ever used.', author: 'Sam Okafor' }, // expect: SLP-12
];

export function Proof() {
  return (
    <section>
      <p>Over 2,500 restaurants use Tablewise every night.</p> {/* expect: SLP-12 */}
      {customers.map((c) => <span key={c}>{c}</span>)}
      {testimonials.map((t) => <q key={t.author}>{t.quote}</q>)}
    </section>
  );
}

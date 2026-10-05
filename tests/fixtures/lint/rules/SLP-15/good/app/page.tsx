import { Hero } from '../components/Hero';
import { Pricing } from '@/components/Pricing';

// Pricing lives in a component this scan cannot read, so the set of calls to action is not complete.
export default function Page() {
  return (
    <main>
      <Hero />
      <Pricing />
    </main>
  );
}

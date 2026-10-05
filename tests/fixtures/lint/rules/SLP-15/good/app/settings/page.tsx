import { RotaHero } from '../../components/RotaHero';

// The page's own button is generic, but the hero it renders names its outcome.
export default function Settings() {
  return (
    <main>
      <RotaHero />
      <button type="button">Get started</button>
    </main>
  );
}

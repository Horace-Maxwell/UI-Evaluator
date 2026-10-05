import { motion } from 'framer-motion';

// One authored entrance on the first screen; the rest is visible at rest.
export function Landing() {
  return (
    <main>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Hero</motion.section>
      <section>Features</section>
      <section>Pricing</section>
      <motion.section initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}>Story</motion.section>
      <motion.section initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}>Team</motion.section>
    </main>
  );
}

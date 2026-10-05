import { motion } from 'framer-motion';
import { FadeIn } from './FadeIn';

export function Landing() {
  return (
    <main>
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}>One</motion.section>
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}>Two</motion.section>
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}>Three</motion.section> {/* expect: SLP-09 */}
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}>Four</motion.section>
      <FadeIn delay={0.1}><p>Alpha</p></FadeIn>
      <FadeIn delay={0.2}><p>Beta</p></FadeIn>
      <FadeIn delay={0.3}><p>Gamma</p></FadeIn> {/* expect: SLP-09 */}
    </main>
  );
}

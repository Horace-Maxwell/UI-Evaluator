import { motion } from 'framer-motion';

export function Toast() {
  return (
    <div>
      <span className="animate-bounce">↓</span> {/* expect: MOT-03 */}
      <div className="transition ease-[cubic-bezier(0.68,-0.6,0.32,1.6)]">Saved</div> {/* expect: MOT-03 */}
      <motion.div animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.4 }}>Saved</motion.div> {/* expect: MOT-03 */}
    </div>
  );
}

import { motion } from 'framer-motion';

export function Panel({ open }: { open: boolean }) {
  return (
    <div>
      <button className="transition-all hover:bg-accent">Toggle</button> {/* expect: MOT-01 */}
      <div className="transition-[max-height] duration-300">Body</div> {/* expect: MOT-01 */}
      <motion.div animate={{ height: open ? 'auto' : 0 }}>Details</motion.div> {/* expect: MOT-01 */}
    </div>
  );
}

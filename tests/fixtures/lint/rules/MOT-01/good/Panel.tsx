import { motion } from 'framer-motion';

export function Panel({ open }: { open: boolean }) {
  return (
    <div>
      <button className="transition-colors hover:bg-accent motion-reduce:transition-none">Toggle</button>
      <motion.div animate={{ opacity: open ? 1 : 0, scaleY: open ? 1 : 0.98 }}>Details</motion.div>
    </div>
  );
}

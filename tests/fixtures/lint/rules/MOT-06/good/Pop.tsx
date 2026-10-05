import { motion } from 'framer-motion';

export function Pop() {
  return (
    <div>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>Hi</motion.div>
      <div className="scale-95 opacity-0 transition data-[state=open]:scale-100 data-[state=open]:opacity-100">Menu</div>
    </div>
  );
}

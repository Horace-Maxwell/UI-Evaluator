import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, scale: 0 }, // expect: MOT-06
  shown: { opacity: 1, scale: 1 },
};

export function Pop() {
  return (
    <div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>Hi</motion.div> {/* expect: MOT-06 */}
      <div className="scale-0 transition-transform data-[state=open]:scale-100">Menu</div> {/* expect: MOT-06 */}
      <motion.ul variants={variants} />
    </div>
  );
}

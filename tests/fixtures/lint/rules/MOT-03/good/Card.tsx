import { motion } from 'framer-motion';

// Overshoot only where a finger supplies momentum: the drag release.
export function SwipeCard() {
  return (
    <motion.div drag="x" dragTransition={{ bounceStiffness: 300 }} onDragEnd={() => {}} transition={{ type: 'spring', bounce: 0 }}>
      Swipe to archive
    </motion.div>
  );
}

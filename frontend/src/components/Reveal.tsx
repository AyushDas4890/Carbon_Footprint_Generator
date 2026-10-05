import type { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';

const item: Variants = {
  hidden: { opacity: 0, y: 48, rotateX: -18, filter: 'blur(6px)' },
  show: {
    opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 90, damping: 18 },
  },
};

/** Fades/flips its content up in 3D the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      style={{ transformPerspective: 900 }}
      variants={item}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers each direct <RevealItem> child in as the group enters the viewport. */
export function RevealGroup({ children, className, stagger = 0.1 }: { children: ReactNode; className?: string; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={item} style={{ transformPerspective: 900 }}>
      {children}
    </motion.div>
  );
}

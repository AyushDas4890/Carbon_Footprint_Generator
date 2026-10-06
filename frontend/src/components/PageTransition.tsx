import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Wraps each routed page. Exit: an ink panel rises over the old page. Enter:
 * it carries the new page's title and lifts away.
 */
export function PageTransition({ children, title }: { children: ReactNode; title: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <main className="page">{children}</main>;

  return (
    <>
      <motion.main
        className="page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, delay: 0.3 } }}
        exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.2 } }}
      >
        {children}
      </motion.main>

      <motion.div
        className="curtain"
        style={{ originY: 1 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1, transition: { duration: 0.5, ease: EASE } }}
        aria-hidden
      />
      <motion.div
        className="curtain"
        style={{ originY: 0 }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0, transition: { duration: 0.75, delay: 0.25, ease: EASE } }}
        exit={{ scaleY: 0 }}
        aria-hidden
      >
        <motion.span
          className="curtain-word"
          initial={{ y: '100%' }}
          animate={{ y: '-120%', transition: { duration: 0.8, ease: EASE } }}
        >
          {title}
        </motion.span>
      </motion.div>
    </>
  );
}

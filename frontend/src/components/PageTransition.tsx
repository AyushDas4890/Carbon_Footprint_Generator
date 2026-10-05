import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Wraps each routed page. On enter a brand-gradient stripe and a dark curtain
 * sweep up off the screen revealing the page; on exit they sweep back in.
 */
export function PageTransition({ children, title }: { children: ReactNode; title: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <main className="page">{children}</main>;

  return (
    <>
      <motion.main
        className="page"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.35, ease: EASE } }}
        exit={{ opacity: 0, y: -30, transition: { duration: 0.35, ease: EASE } }}
      >
        {children}
      </motion.main>

      {/* Exit: stripe then curtain slide up from the bottom to cover the old page. */}
      <motion.div
        className="curtain"
        style={{ originY: 1 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 0 }}
        exit={{ scaleY: 1, transition: { duration: 0.5, ease: EASE } }}
        aria-hidden
      />
      {/* Enter: curtain (with page title) lifts away from the top. */}
      <motion.div
        className="curtain"
        style={{ originY: 0 }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0, transition: { duration: 0.7, delay: 0.15, ease: EASE } }}
        exit={{ scaleY: 0 }}
        aria-hidden
      >
        <motion.span
          className="curtain-word gradient-text"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -40, transition: { duration: 0.35, ease: EASE } }}
        >
          {title}
        </motion.span>
      </motion.div>
      <motion.div
        className="curtain-stripe"
        style={{ position: 'fixed', inset: 0, zIndex: 89, originY: 0, pointerEvents: 'none' }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0, transition: { duration: 0.6, delay: 0.3, ease: EASE } }}
        exit={{ scaleY: 0 }}
        aria-hidden
      />
    </>
  );
}

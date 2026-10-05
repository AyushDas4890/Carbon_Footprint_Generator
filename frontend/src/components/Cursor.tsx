import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

const INTERACTIVE = 'a, button, input, select, textarea, [role="button"], .tilt';

/** Dot + lagging ring cursor for mouse users; the ring swells over interactive elements. */
export function Cursor() {
  const reduce = useReducedMotion();
  const [enabled] = useState(() => window.matchMedia('(pointer: fine)').matches);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 });

  const active = enabled && !reduce;

  useEffect(() => {
    if (!active) return;
    document.body.classList.add('has-custom-cursor');
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHovering(!!(e.target as Element | null)?.closest?.(INTERACTIVE));
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [active, x, y]);

  if (!active) return null;
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} animate={{ scale: hovering ? 0 : 1 }} />
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY }}
        animate={{
          scale: hovering ? 1.7 : 1,
          backgroundColor: hovering ? 'rgba(100,255,180,0.08)' : 'rgba(100,255,180,0)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      />
    </>
  );
}

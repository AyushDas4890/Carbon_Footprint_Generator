import { useRef } from 'react';
import {
  motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring,
  useTransform, useVelocity, wrap,
} from 'motion/react';

interface Props {
  items: string[];
  /** Base speed in % of one copy per second; negative scrolls right. */
  speed?: number;
  outline?: boolean;
}

/**
 * Infinite ticker whose speed and skew react to scroll velocity — scrolling
 * fast whips it along and it eases back to cruising speed when you stop.
 */
export function Marquee({ items, speed = 2.5, outline = false }: Props) {
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [-4, 0, 4], { clamp: false });
  const skewX = useTransform(velocity, [-2000, 2000], [8, -8]);
  const direction = useRef(1);

  // Two copies of the content: wrapping at -50% makes the loop seamless.
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) direction.current = -1;
    else if (b > 0) direction.current = 1;
    const move = direction.current * speed * (delta / 1000) * (1 + Math.abs(b));
    base.set(base.get() - move);
  });

  const row = items.flatMap((text, i) => [
    <span key={`t${i}`} className={`marquee-item${outline ? ' outline' : ''}`}>{text}</span>,
    <span key={`s${i}`} className="marquee-item"><span className="spark">✦</span></span>,
  ]);

  return (
    <div className="marquee" aria-hidden>
      <motion.div className="marquee-track" style={{ x, skewX: reduce ? 0 : skewX }}>
        {row}
        {row.map((el) => ({ ...el, key: `dup-${el.key}` }))}
      </motion.div>
    </div>
  );
}

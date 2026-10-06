import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Start when scrolled into view (default) or immediately on mount. */
  onView?: boolean;
}

/** Number that rolls up from zero with an expo ease. */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', className, onView = true }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) =>
    prefix + n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        el.textContent = format(value);
        return;
      }
      const counter = { n: 0 };
      gsap.to(counter, {
        n: value,
        duration: 1.8,
        ease: 'expo.out',
        onUpdate: () => { el.textContent = format(counter.n); },
        scrollTrigger: onView ? { trigger: el, start: 'top 92%', once: true } : undefined,
      });
    },
    { dependencies: [value], scope: ref },
  );

  return <span ref={ref} className={className}>{format(0)}</span>;
}

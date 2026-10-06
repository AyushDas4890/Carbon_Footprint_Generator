import { useEffect, type MouseEvent } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

let lenis: Lenis | null = null;

/** Scrolls via Lenis when it is running so the smoothing stays consistent; native otherwise. */
export function scrollToTarget(target: HTMLElement | number, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 });
    return;
  }
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/** Click handler for in-page `#id` links so they glide instead of jumping. */
export function scrollToHash(e: MouseEvent<HTMLAnchorElement>) {
  const hash = e.currentTarget.hash;
  const target = hash ? document.getElementById(hash.slice(1)) : null;
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target, -24);
}

/** Lenis smooth scroll driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);
}

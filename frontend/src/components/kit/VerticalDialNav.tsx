import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/gsap';
import { scrollToTarget } from '../../lib/useSmoothScroll';

interface Section { id: string; label: string }

const SPACING = 64; // px between section labels on the drum
const TICKS_PER_SECTION = 6;

/**
 * Fixed rotary dial on the right edge. Section labels and minor ticks sit on a
 * drum that turns with scroll so the current section lines up with the fixed
 * index needle; labels further from the needle tilt away and fade. Click a
 * label to travel there. Scroll position is read on rAF and written straight
 * to the DOM, so nothing re-renders while scrolling.
 *
 * The dial flips to paper colour while its needle sits over an element inside
 * `[data-surface="dark"]` (hit-testing respects clip-path, so a half-open
 * ScrollZoomReveal frame only counts where it is actually visible).
 */
export function VerticalDialNav({ sections }: { sections: Section[] }) {
  const root = useRef<HTMLElement>(null);
  const drum = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = drum.current;
    if (!el) return;
    const labels = Array.from(el.querySelectorAll<HTMLElement>('[data-dial-label]'));
    const ticks = Array.from(el.querySelectorAll<HTMLElement>('[data-dial-tick]'));
    const reduce = prefersReducedMotion();
    let raf = 0, current = 0, lastActive = -1, frame = 0;

    const overDark = () => {
      const r = needle.current?.getBoundingClientRect();
      if (!r) return false;
      for (const node of document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)) {
        if (root.current?.contains(node)) continue;
        const surface = node.closest<HTMLElement>('[data-surface]');
        if (surface) return surface.dataset.surface === 'dark';
      }
      return false;
    };

    // Continuous index: 1.5 means halfway between section 1 and section 2.
    const target = () => {
      const mid = window.innerHeight * 0.5;
      const tops = sections.map((s) => document.getElementById(s.id)?.getBoundingClientRect().top ?? Infinity);
      for (let i = tops.length - 1; i >= 0; i--) {
        if (tops[i] <= mid) {
          const next = tops[i + 1];
          if (next === undefined || !isFinite(next)) return i;
          return i + Math.min(1, (mid - tops[i]) / Math.max(1, next - tops[i]));
        }
      }
      return 0;
    };

    const paint = () => {
      const goal = target();
      current = reduce ? goal : current + (goal - current) * 0.14;
      el.style.transform = `translateY(${-current * SPACING}px)`;
      const place = (node: HTMLElement, pos: number) => {
        const d = pos - current;
        node.style.transform = `rotateX(${Math.max(-80, Math.min(80, -d * 24))}deg)`;
        node.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 0.32));
      };
      labels.forEach((node, i) => place(node, i));
      ticks.forEach((node) => place(node, Number(node.dataset.pos)));
      // Hit-testing every frame is wasted work; a few times a second is plenty for a colour fade.
      if (frame++ % 6 === 0) root.current?.classList.toggle('is-on-dark', overDark());
      const active = Math.round(current);
      if (active !== lastActive && readout.current) {
        lastActive = active;
        readout.current.textContent = String(active + 1).padStart(2, '0');
        labels.forEach((node, i) => node.classList.toggle('is-active', i === active));
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [sections]);

  const go = (id: string) => {
    const target = document.getElementById(id);
    if (target) scrollToTarget(target);
  };

  const ticks: number[] = [];
  for (let i = 0; i < sections.length - 1; i++) {
    for (let k = 1; k < TICKS_PER_SECTION; k++) ticks.push(i + k / TICKS_PER_SECTION);
  }

  return (
    <nav ref={root} className="dial" aria-label="Sections on this page">
      <div className="dial-readout mono">
        <span ref={readout}>01</span>
        <span className="dial-total">/{String(sections.length).padStart(2, '0')}</span>
      </div>
      <div className="dial-window">
        <span ref={needle} className="dial-needle" aria-hidden />
        <div ref={drum} className="dial-drum">
          {ticks.map((pos) => (
            <span key={pos} data-dial-tick data-pos={pos} className="dial-tick" style={{ top: pos * SPACING }} aria-hidden />
          ))}
          {sections.map((s, i) => (
            <button key={s.id} type="button" data-dial-label className="dial-label" style={{ top: i * SPACING }} onClick={() => go(s.id)}>
              <span className="dial-major" aria-hidden />
              <span className="dial-text">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import { ART_FALLBACK, getShaderArt, type ArtKind } from '../lib/shaderArt';

export interface StackItem {
  meta: string;
  title: string;
  body: string;
  tag: string;
  art: ArtKind;
  to: string;
}

const FALLBACK_TOP = 112; // px; the real sticky offsets come from CSS (--base-top / --peek)
const SHRINK = 0.035; // how much each card shrinks per card stacked on top of it

const PLUS = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Scroll-driven card deck: each card sticks a little lower than the one before,
 * so earlier cards stay visible as a narrowing stack while the incoming card's
 * copy sharpens into focus as it lands.
 */
export function StackedCards({ items }: { items: StackItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [art, setArt] = useState<Partial<Record<ArtKind, string>>>({});

  useEffect(() => {
    getShaderArt()
      .then(setArt)
      .catch((err: Error) => console.warn('Shader art unavailable, using gradients:', err.message));
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const cards = gsap.utils.toArray<HTMLElement>('.stack-card', root.current);
      const n = cards.length;
      // Read the real sticky offset so triggers match the CSS at every breakpoint.
      const tops = cards.map((c) => parseFloat(getComputedStyle(c).top) || FALLBACK_TOP);
      const topFor = (i: number) => tops[i];

      cards.forEach((card, i) => {
        const inner = card.querySelector<HTMLElement>('.stack-inner')!;
        const copy = card.querySelector<HTMLElement>('.stack-copy')!;
        const img = card.querySelector<HTMLElement>('.stack-art-img')!;

        // Incoming: copy goes from faint + blurred to crisp; artwork settles from a zoom.
        gsap.fromTo(copy, { opacity: 0.15, filter: 'blur(6px)', y: 18 }, {
          opacity: 1, filter: 'blur(0px)', y: 0, ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 88%', end: `top ${topFor(i) + 40}px`, scrub: true },
        });
        gsap.fromTo(img, { scale: 1.22 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: `top ${topFor(i)}px`, scrub: true },
        });

        if (i === n - 1) return;
        // Covered: shrink toward the top edge for the rest of the deck, so older cards narrow more.
        gsap.to(inner, {
          scale: 1 - SHRINK * (n - 1 - i), ease: 'none',
          scrollTrigger: {
            trigger: card, start: `top ${topFor(i)}px`,
            endTrigger: cards[n - 1], end: `top ${topFor(n - 1)}px`, scrub: true,
          },
        });
        // ...and fade its copy while the next card slides over it.
        gsap.to(copy, {
          opacity: 0.25, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: `top ${topFor(i + 1)}px`, scrub: true },
        });
      });
    },
    { scope: root, dependencies: [items.length] },
  );

  return (
    <div ref={root} className="stack" style={{ '--n': items.length } as CSSProperties}>
      {items.map((it, i) => (
        <article key={it.title} className="stack-card" style={{ '--i': i } as CSSProperties}>
          <div className="stack-inner">
            <div className="stack-art" style={{ background: ART_FALLBACK[it.art] }}>
              {art[it.art] && <img className="stack-art-img" src={art[it.art]} alt="" draggable={false} />}
              {!art[it.art] && <div className="stack-art-img" />}
            </div>
            <div className="stack-copy">
              <div className="stack-meta">{it.meta}</div>
              <h3 className="stack-title">{it.title}</h3>
              <p className="stack-body">{it.body}</p>
              <div className="stack-foot">
                <span className="stack-tag">{it.tag}</span>
                {it.to.startsWith('#') ? (
                  <a href={it.to} className="stack-plus" aria-label={`Open ${it.title}`}>{PLUS}</a>
                ) : (
                  <Link to={it.to} className="stack-plus" aria-label={`Open ${it.title}`}>{PLUS}</Link>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

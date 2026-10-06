import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP } from '../../lib/gsap';
import { scrollToHash } from '../../lib/useSmoothScroll';

export interface ScrollerItem {
  index: string;
  title: string;
  body: string;
  tag: string;
  to: string;
  image: ReactNode;
}

interface Props {
  items: ScrollerItem[];
  heading: ReactNode;
  id?: string;
}

/**
 * Vertical scroll drives a horizontal strip of image cards. The section pins
 * for exactly as long as the strip is wider than the viewport, each image
 * drifts inside its frame for parallax, and a hairline tracks progress.
 * Below 760px (or with reduced motion) it falls back to native swipe + snap.
 */
export function ImageScroller({ items, heading, id }: Props) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>('.isc-img-inner', root.current).forEach((img) => {
          gsap.fromTo(img, { xPercent: -12 }, {
            xPercent: 12,
            ease: 'none',
            scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        });
        gsap.fromTo('.isc-progress-bar', { scaleX: 0 }, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${distance()}`, scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} className="isc">
      <div className="isc-head container">{heading}</div>
      <div ref={track} className="isc-track">
        {items.map((item) => {
          const inPage = item.to.startsWith('#');
          const body = (
            <>
              <div className="isc-img">
                <div className="isc-img-inner">{item.image}</div>
                <span className="isc-tag mono">{item.tag}</span>
              </div>
              <div className="isc-copy">
                <span className="isc-index mono">{item.index}</span>
                <h3 className="isc-title">{item.title}</h3>
                <p className="isc-body">{item.body}</p>
                <span className="isc-link mono">Open <span aria-hidden>→</span></span>
              </div>
            </>
          );
          return inPage ? (
            <a key={item.index} href={item.to} className="isc-card" onClick={scrollToHash}>{body}</a>
          ) : (
            <Link key={item.index} to={item.to} className="isc-card">{body}</Link>
          );
        })}
      </div>
      <div className="isc-progress container" aria-hidden><span className="isc-progress-bar" /></div>
    </section>
  );
}

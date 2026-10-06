import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  /** Full-bleed media that grows out of the small frame. */
  media: ReactNode;
  /** Two halves of the headline that part as the frame opens. */
  left: string;
  right: string;
  /** Copy that settles over the media once it fills the screen. */
  children?: ReactNode;
  id?: string;
}

/**
 * Pinned section: a small framed window in the middle of the screen opens up
 * (clip-path, so the media never distorts) until it fills the viewport, while
 * the headline halves slide apart and the media counter-zooms inside.
 */
export function ScrollZoomReveal({ media, left, right, children, id }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      tl.fromTo(q('.szr-frame'), { clipPath: 'inset(34% 37% 34% 37% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0)
        .fromTo(q('.szr-media'), { scale: 1.45 }, { scale: 1, duration: 1 }, 0)
        .fromTo(q('.szr-left'), { xPercent: 0, opacity: 1 }, { xPercent: -160, opacity: 0, duration: 0.8 }, 0)
        .fromTo(q('.szr-right'), { xPercent: 0, opacity: 1 }, { xPercent: 160, opacity: 0, duration: 0.8 }, 0)
        .fromTo(q('.szr-meta'), { opacity: 1 }, { opacity: 0, duration: 0.25 }, 0)
        .fromTo(q('.szr-copy > *'), { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.25 }, 0.82);
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} className="szr">
      <div className="szr-sticky">
        <div className="szr-frame">
          <div className="szr-media">{media}</div>
          <div className="szr-shade" />
        </div>
        <h2 className="szr-title" aria-label={`${left} ${right}`}>
          <span className="szr-left">{left}</span>
          <span className="szr-right">{right}</span>
        </h2>
        <div className="szr-meta mono">Scroll to open</div>
        {children && <div className="szr-copy">{children}</div>}
      </div>
    </section>
  );
}

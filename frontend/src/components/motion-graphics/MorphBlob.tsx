import { useId, useRef, type CSSProperties } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

// Hand-drawn organic outlines in a 200×200 box; MorphSVG interpolates between them.
const SHAPES = [
  'M44.6,-62.9C56.7,-52.6,64.6,-38.2,69.8,-22.6C75,-7,77.5,9.8,72.1,23.7C66.7,37.6,53.4,48.6,38.9,57.6C24.4,66.6,8.7,73.6,-7.9,74.2C-24.5,74.8,-41.9,69,-53.9,57.6C-65.9,46.2,-72.6,29.2,-74.5,12C-76.4,-5.2,-73.5,-22.6,-64.6,-35.7C-55.7,-48.8,-40.8,-57.6,-26.1,-66.5C-11.4,-75.4,3.1,-84.4,17.6,-82.3C32.1,-80.2,32.5,-73.2,44.6,-62.9Z',
  'M38.4,-50.6C52.8,-43.6,69.1,-36.2,74.5,-23.9C79.9,-11.6,74.4,5.6,66.4,19.7C58.4,33.8,47.9,44.8,35.2,54.3C22.5,63.8,7.6,71.8,-9.2,74.2C-26,76.6,-44.7,73.4,-55.5,62.2C-66.3,51,-69.2,31.8,-71.1,13.6C-73,-4.6,-73.9,-21.8,-66.2,-34.1C-58.5,-46.4,-42.2,-53.8,-27.4,-60.6C-12.6,-67.4,0.7,-73.6,12.4,-70.7C24.1,-67.8,24,-57.6,38.4,-50.6Z',
  'M47.7,-63.9C60.8,-56.9,69.4,-41.4,74.6,-25.1C79.8,-8.8,81.6,8.3,76,22.7C70.4,37.1,57.4,48.8,43.2,58.6C29,68.4,13.6,76.3,-2.6,79.9C-18.8,83.5,-37.6,82.8,-49.8,73.1C-62,63.4,-67.6,44.7,-71.1,27.1C-74.6,9.5,-76,-7,-70.3,-20.4C-64.6,-33.8,-51.8,-44.1,-38.5,-51.1C-25.2,-58.1,-12.6,-61.8,2.4,-65.1C17.4,-68.4,34.6,-70.9,47.7,-63.9Z',
];

interface Props {
  from: string;
  to: string;
  size?: number;
  style?: CSSProperties;
  duration?: number;
}

/** Blurred gradient blob that endlessly morphs between organic shapes and drifts. */
export function MorphBlob({ from, to, size = 520, style, duration = 6 }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const gid = useId().replace(/:/g, '');

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const path = ref.current?.querySelector('path');
      if (!path) return;
      const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration, ease: 'sine.inOut' } });
      tl.to(path, { morphSVG: SHAPES[1] }).to(path, { morphSVG: SHAPES[2] });
      gsap.to(ref.current, { rotation: 360, duration: duration * 6, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
      gsap.to(ref.current, { x: '+=40', y: '-=30', duration: duration * 1.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    },
    { scope: ref },
  );

  return (
    <svg ref={ref} className="blob" viewBox="-100 -100 200 200" width={size} height={size} style={style} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path d={SHAPES[0]} fill={`url(#${gid})`} />
    </svg>
  );
}

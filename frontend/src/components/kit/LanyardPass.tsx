import { useEffect, useRef, type ReactNode } from 'react';
import { prefersReducedMotion } from '../../lib/gsap';

interface Props {
  children: ReactNode;
  /** Card size in px. */
  width?: number;
  height?: number;
  /** Strap length from the anchor to the card clip, px. */
  strapLength?: number;
  /** Repeated along the strap. */
  strapText?: string;
  className?: string;
}

interface Point { x: number; y: number; px: number; py: number; pinned?: boolean }

const SEGMENTS = 14;
const GRAVITY = 2200; // px/s²
const DAMPING = 0.986;
const ITERATIONS = 24;
const STEP = 1 / 120;

/**
 * A badge hanging from a strap. The strap is a Verlet rope; the card is two
 * extra particles (clip + bottom edge) held a card-height apart, so it swings,
 * twists and can be grabbed and thrown. The strap is drawn as an SVG ribbon
 * with its label running along it via <textPath>.
 */
export function LanyardPass({ children, width = 280, height = 400, strapLength = 260, strapText = 'C4FUTURE · CARBON PASS · ', className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const strapRef = useRef<SVGPathElement>(null);
  const strapBackRef = useRef<SVGPathElement>(null);
  const clipRef = useRef<SVGGElement>(null);
  const pathId = useRef(`strap-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const root = rootRef.current, card = cardRef.current;
    const strap = strapRef.current, strapBack = strapBackRef.current, clip = clipRef.current;
    if (!root || !card || !strap || !strapBack || !clip) return;

    const segLen = strapLength / SEGMENTS;
    let anchorX = root.clientWidth / 2;
    const reduce = prefersReducedMotion();

    // Rope particles, then clip (index n-2) and card bottom (index n-1).
    const pts: Point[] = [];
    const dropFrom = reduce ? 0 : -strapLength - height - 80;
    for (let i = 0; i <= SEGMENTS; i++) {
      const y = i * segLen;
      const x = anchorX + (reduce ? 0 : i * 6);
      pts.push({ x, y: y + (i ? dropFrom : 0), px: x, py: y + (i ? dropFrom : 0) });
    }
    const clipIdx = SEGMENTS;
    pts.push({ x: anchorX + (reduce ? 0 : 40), y: strapLength + height + dropFrom, px: anchorX + (reduce ? 0 : 40), py: strapLength + height + dropFrom });
    const bottomIdx = pts.length - 1;
    pts[0].pinned = true;

    let grab: { idx: number; ox: number; oy: number; x: number; y: number } | null = null;
    let raf = 0, last = performance.now(), acc = 0, visible = true;

    const constrain = (a: Point, b: Point, len: number, stiffness = 1) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const diff = ((d - len) / d) * stiffness;
      const aFixed = a.pinned || (grab && pts[grab.idx] === a);
      const bFixed = b.pinned || (grab && pts[grab.idx] === b);
      if (aFixed && bFixed) return;
      if (aFixed) { b.x -= dx * diff; b.y -= dy * diff; return; }
      if (bFixed) { a.x += dx * diff; a.y += dy * diff; return; }
      a.x += dx * diff * 0.5; a.y += dy * diff * 0.5;
      b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5;
    };

    const step = (dt: number) => {
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (grab && grab.idx === i) {
          p.px = p.x; p.py = p.y;
          p.x = grab.x; p.y = grab.y;
          continue;
        }
        const vx = (p.x - p.px) * DAMPING, vy = (p.y - p.py) * DAMPING;
        p.px = p.x; p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * dt * dt;
      }
      pts[0].x = anchorX; pts[0].y = 0;
      for (let k = 0; k < ITERATIONS; k++) {
        for (let i = 0; i < SEGMENTS; i++) constrain(pts[i], pts[i + 1], segLen);
        constrain(pts[clipIdx], pts[bottomIdx], height);
      }
    };

    const render = () => {
      const top = pts[clipIdx], bottom = pts[bottomIdx];
      const angle = Math.atan2(bottom.x - top.x, bottom.y - top.y);
      // Horizontal speed of the card gives it a little turn on its vertical axis.
      const vx = bottom.x - bottom.px;
      const turn = Math.max(-35, Math.min(35, vx * 2.2));
      card.style.transform = `translate3d(${top.x - width / 2}px, ${top.y}px, 0) rotate(${-angle}rad) rotateY(${turn}deg)`;

      let d = `M ${pts[0].x} ${pts[0].y - 40}`;
      for (let i = 0; i <= SEGMENTS; i++) {
        const p = pts[i], n = pts[Math.min(i + 1, SEGMENTS)];
        d += ` Q ${p.x} ${p.y} ${(p.x + n.x) / 2} ${(p.y + n.y) / 2}`;
      }
      d += ` L ${top.x} ${top.y}`;
      strap.setAttribute('d', d);
      strapBack.setAttribute('d', d);
      clip.setAttribute('transform', `translate(${top.x} ${top.y}) rotate(${(-angle * 180) / Math.PI})`);
    };

    const frame = (now: number) => {
      acc += Math.min((now - last) / 1000, 0.05);
      last = now;
      while (acc >= STEP) { step(STEP); acc -= STEP; }
      render();
      if (visible) raf = requestAnimationFrame(frame);
    };

    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onDown = (e: PointerEvent) => {
      const at = local(e);
      const top = pts[clipIdx], bottom = pts[bottomIdx];
      // Grab whichever end of the card is nearer the pointer.
      const nearTop = Math.hypot(at.x - top.x, at.y - top.y) < Math.hypot(at.x - bottom.x, at.y - bottom.y);
      const idx = nearTop ? clipIdx : bottomIdx;
      grab = { idx, ox: pts[idx].x - at.x, oy: pts[idx].y - at.y, x: pts[idx].x, y: pts[idx].y };
      card.setPointerCapture(e.pointerId);
      card.classList.add('is-grabbed');
    };
    const onMove = (e: PointerEvent) => {
      if (!grab) return;
      const at = local(e);
      grab.x = at.x + grab.ox;
      grab.y = at.y + grab.oy;
    };
    const onUp = () => {
      grab = null;
      card.classList.remove('is-grabbed');
    };

    const ro = new ResizeObserver(() => { anchorX = root.clientWidth / 2; if (reduce) { pts.forEach((p) => { p.x = anchorX; p.px = anchorX; }); step(0); render(); } });
    ro.observe(root);

    if (reduce) {
      for (let i = 0; i < 400; i++) step(STEP);
      render();
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
    io.observe(root);
    card.addEventListener('pointerdown', onDown);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', onUp);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
    };
  }, [width, height, strapLength]);

  return (
    <div ref={rootRef} className={`lanyard ${className ?? ''}`} style={{ height: strapLength + height + 80 }}>
      <svg className="lanyard-strap" aria-hidden>
        <path ref={strapBackRef} className="lanyard-ribbon" />
        <path ref={strapRef} id={pathId} className="lanyard-ribbon-core" />
        <text className="lanyard-text" dy="3.5">
          <textPath href={`#${pathId}`} startOffset="40">{strapText.repeat(8)}</textPath>
        </text>
        <g ref={clipRef}>
          <rect x="-16" y="-14" width="32" height="20" rx="3" className="lanyard-clip" />
          <rect x="-7" y="-9" width="14" height="6" rx="2" className="lanyard-clip-hole" />
        </g>
      </svg>
      <div ref={cardRef} className="lanyard-card" style={{ width, height }}>
        {children}
      </div>
    </div>
  );
}

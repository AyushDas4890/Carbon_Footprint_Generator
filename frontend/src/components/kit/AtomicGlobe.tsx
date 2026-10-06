import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../lib/gsap';

interface Props {
  /** Dot colour for the sphere and orbit rings. */
  ink?: string;
  /** Electron colour. */
  accent?: string;
  /** Colour behind the sphere; used to occlude the back half of the orbits. */
  background?: string;
  className?: string;
  /** 0→1 scroll progress; the globe tilts and drifts back as it rises. */
  progress?: { current: number };
}

interface Ring { rx: number; rz: number; speed: number; radius: number; electrons: number }

const DOTS = 1400;
const TILT = (-23.4 * Math.PI) / 180;
const RINGS: Ring[] = [
  { rx: 1.2, rz: 0.35, speed: 0.55, radius: 1.42, electrons: 2 },
  { rx: 1.2, rz: 2.45, speed: -0.42, radius: 1.42, electrons: 1 },
  { rx: 0.18, rz: 1.4, speed: 0.33, radius: 1.62, electrons: 2 },
];

// Cheap 3D value noise; only used to clump dots into "landmasses".
function hash(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

function buildSphere() {
  const pts: { x: number; y: number; z: number; land: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < DOTS; i++) {
    const y = 1 - (i / (DOTS - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * r, z = Math.sin(theta) * r;
    const n = noise3(x * 1.9 + 4, y * 1.9 + 1, z * 1.9 + 7) * 0.7 + noise3(x * 4.2, y * 4.2, z * 4.2) * 0.3;
    pts.push({ x, y, z, land: n > 0.52 ? 1 : 0 });
  }
  return pts;
}

/**
 * A dotted globe wrapped in electron orbits, drawn on a 2D canvas. Points sit
 * on a Fibonacci sphere; orbits are tilted circles split into a back half
 * (hidden behind the sphere's disc) and a front half drawn over it.
 */
export function AtomicGlobe({ ink = '#edeae3', accent = '#e0481d', background = '#0e0e0c', className, progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const sphere = buildSphere();
    const reduce = prefersReducedMotion();
    let width = 0, height = 0, dpr = 1;
    let raf = 0, visible = true, last = performance.now(), t = 0;
    let spin = 0, spinVelocity = 0.12;
    let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
    let dragging = false, dragX = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const draw = () => {
      const p = progress?.current ?? 0;
      const R = Math.min(width, height) * 0.3 * (1 - p * 0.18);
      const cx = width / 2 + smoothX * 14;
      const cy = height / 2 + smoothY * 10 - p * height * 0.06;
      const tilt = TILT + smoothY * 0.18 + p * 0.5;
      const cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const cosS = Math.cos(spin), sinS = Math.sin(spin);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Orbit samples, transformed once per frame and reused for both passes.
      const ringPts = RINGS.map((ring, ri) => {
        const pts: { x: number; y: number; z: number }[] = [];
        const rz = ring.rz + t * 0.04 * (ri % 2 ? -1 : 1);
        const cx1 = Math.cos(ring.rx), sx1 = Math.sin(ring.rx), cz = Math.cos(rz), sz = Math.sin(rz);
        for (let i = 0; i <= 160; i++) {
          const a = (i / 160) * Math.PI * 2;
          let x = Math.cos(a) * ring.radius, y = Math.sin(a) * ring.radius, z = 0;
          // tilt the ring plane (X), then spin it about the view axis (Z)
          const y1 = y * cx1 - z * sx1; z = y * sx1 + z * cx1; y = y1;
          const x2 = x * cz - y * sz; y = x * sz + y * cz; x = x2;
          pts.push({ x, y, z });
        }
        return pts;
      });

      const strokeRings = (front: boolean) => {
        ctx.lineWidth = 1;
        for (const pts of ringPts) {
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            if (front !== (b.z >= 0)) continue;
            const depth = (b.z + 1.6) / 3.2;
            ctx.strokeStyle = ink;
            ctx.globalAlpha = front ? 0.25 + depth * 0.45 : 0.08 + depth * 0.1;
            ctx.beginPath();
            ctx.moveTo(cx + a.x * R, cy + a.y * R);
            ctx.lineTo(cx + b.x * R, cy + b.y * R);
            ctx.stroke();
          }
        }
      };

      strokeRings(false);

      // Disc that hides the back half of the orbits behind the sphere.
      ctx.globalAlpha = 1;
      ctx.fillStyle = background;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.01, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ink;
      for (const pt of sphere) {
        const x1 = pt.x * cosS + pt.z * sinS;
        const z1 = -pt.x * sinS + pt.z * cosS;
        const y2 = pt.y * cosT - z1 * sinT;
        const z2 = pt.y * sinT + z1 * cosT;
        if (z2 < -0.15) continue;
        const depth = (z2 + 1) / 2;
        const size = (pt.land ? 2 : 1) * (0.6 + depth * 0.8);
        ctx.globalAlpha = (pt.land ? 1 : 0.32) * (0.2 + depth * 0.8);
        ctx.fillRect(cx + x1 * R - size / 2, cy + y2 * R - size / 2, size, size);
      }

      strokeRings(true);

      // Electrons ride the rings; the ones behind the sphere stay hidden.
      RINGS.forEach((ring, ri) => {
        const pts = ringPts[ri];
        for (let e = 0; e < ring.electrons; e++) {
          const phase = (((t * ring.speed) / (Math.PI * 2) + e / ring.electrons) % 1 + 1) % 1;
          for (let k = 0; k < 14; k++) {
            const idx = Math.floor(((phase - (k * 0.004 * Math.sign(ring.speed)) + 1) % 1) * 160);
            const pt = pts[idx];
            const behind = pt.z < 0 && Math.hypot(pt.x, pt.y) < 1;
            if (behind) continue;
            ctx.globalAlpha = k === 0 ? 1 : (1 - k / 14) * 0.5;
            ctx.fillStyle = accent;
            ctx.beginPath();
            ctx.arc(cx + pt.x * R, cy + pt.y * R, k === 0 ? 3.6 : 2.2 * (1 - k / 14) + 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Nucleus glint at the core of the front face.
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;
      if (!dragging) spinVelocity += (0.12 - spinVelocity) * 0.02;
      spin += spinVelocity * dt;
      smoothX += (pointerX - smoothX) * 0.05;
      smoothY += (pointerY - smoothY) * 0.05;
      draw();
      if (visible) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (dragging) {
        spinVelocity = (e.clientX - dragX) * 0.25;
        spin += (e.clientX - dragX) * 0.008;
        dragX = e.clientX;
      }
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      dragX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onUp = () => { dragging = false; };

    resize();
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); });
    ro.observe(canvas);

    if (reduce) {
      draw();
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    };
  }, [ink, accent, background, progress]);

  return <canvas ref={canvasRef} className={`atomic-globe ${className ?? ''}`} aria-label="Rotating dotted globe circled by orbiting electrons" role="img" />;
}

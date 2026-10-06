import { useEffect, useRef } from 'react';

/**
 * Generative "printed plates" used as imagery. Drawn on a 2D canvas at the
 * element's size, so the repo ships no binary images and the art always
 * matches the palette. Each kind is a different reading of emissions data:
 * contours, plumes, freight routes, ridgelines, halftone and bars.
 */
export type PlateKind = 'contour' | 'plume' | 'routes' | 'ridges' | 'halftone' | 'bars';

interface Props {
  kind: PlateKind;
  seed?: number;
  /** 'paper' = green ink on sage; 'ink' = sage on deep green. */
  tone?: 'paper' | 'ink';
  className?: string;
  label?: string;
}

const COLORS = {
  paper: { bg: '#e2e6dd', fg: '#2b3a30', accent: '#b4502a' },
  ink: { bg: '#223027', fg: '#ebeee7', accent: '#d98a5f' },
};

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function makeNoise(seed: number) {
  const rand = rng(seed * 9973 + 17);
  const perm = Array.from({ length: 512 }, () => rand());
  const at = (x: number, y: number) => perm[((x & 255) + ((y & 255) * 31)) & 511];
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function fbm(n: (x: number, y: number) => number, x: number, y: number) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) { v += a * n(x * f, y * f); f *= 2.03; a *= 0.5; }
  return v / 0.9375;
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, c: typeof COLORS.paper, seed: number) => void;

const contour: Draw = (ctx, w, h, c, seed) => {
  const n = makeNoise(seed);
  const cell = Math.max(5, Math.round(Math.min(w, h) / 110));
  const cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1;
  const field: number[] = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) field.push(fbm(n, (i * cell) / 260, (j * cell) / 260));
  const levels = 18;
  for (let L = 1; L < levels; L++) {
    const iso = L / levels;
    const hot = L === 12 || L === 13;
    ctx.strokeStyle = hot ? c.accent : c.fg;
    ctx.globalAlpha = hot ? 1 : 0.55;
    ctx.lineWidth = hot ? 1.6 : 0.8;
    ctx.beginPath();
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i], b = field[j * cols + i + 1], d = field[(j + 1) * cols + i], e = field[(j + 1) * cols + i + 1];
        const x = i * cell, y = j * cell;
        const lerp = (p: number, q: number) => (iso - p) / (q - p || 1e-6);
        const pts: [number, number][] = [];
        if ((a < iso) !== (b < iso)) pts.push([x + lerp(a, b) * cell, y]);
        if ((b < iso) !== (e < iso)) pts.push([x + cell, y + lerp(b, e) * cell]);
        if ((d < iso) !== (e < iso)) pts.push([x + lerp(d, e) * cell, y + cell]);
        if ((a < iso) !== (d < iso)) pts.push([x, y + lerp(a, d) * cell]);
        if (pts.length >= 2) { ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); }
        if (pts.length === 4) { ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); }
      }
    }
    ctx.stroke();
  }
};

const plume: Draw = (ctx, w, h, c, seed) => {
  const n = makeNoise(seed);
  const rand = rng(seed);
  const count = Math.round((w * h) / 900);
  ctx.lineWidth = 0.7;
  for (let k = 0; k < count; k++) {
    // Particles leave a stack near the bottom and drift up through a noise field.
    let x = w * 0.5 + (rand() - 0.5) * w * 0.12, y = h * (0.92 + rand() * 0.06);
    const hot = rand() < 0.06;
    ctx.strokeStyle = hot ? c.accent : c.fg;
    ctx.globalAlpha = hot ? 0.9 : 0.18 + rand() * 0.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 120; s++) {
      const a = fbm(n, x / 220, y / 220) * Math.PI * 2.2 - Math.PI * 0.5;
      x += Math.cos(a) * 2.6 + 0.9;
      y += Math.sin(a) * 1.4 - 2.2;
      ctx.lineTo(x, y);
      if (y < 0 || x > w) break;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.fg;
  ctx.fillRect(w * 0.46, h * 0.9, w * 0.08, h * 0.1);
};

const routes: Draw = (ctx, w, h, c, seed) => {
  const rand = rng(seed);
  const gap = Math.max(10, Math.round(Math.min(w, h) / 46));
  ctx.fillStyle = c.fg;
  ctx.globalAlpha = 0.28;
  for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) ctx.fillRect(x, y, 1.4, 1.4);
  const hubs = Array.from({ length: 9 }, () => [w * (0.08 + rand() * 0.84), h * (0.12 + rand() * 0.76)] as const);
  for (let k = 0; k < 16; k++) {
    const a = hubs[Math.floor(rand() * hubs.length)], b = hubs[Math.floor(rand() * hubs.length)];
    if (a === b) continue;
    const air = k % 5 === 0;
    const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.abs(a[0] - b[0]) * (air ? 0.45 : 0.2);
    ctx.strokeStyle = air ? c.accent : c.fg;
    ctx.globalAlpha = air ? 1 : 0.7;
    ctx.lineWidth = air ? 1.6 : 0.9;
    ctx.setLineDash(air ? [] : [3, 4]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(mx, my, b[0], b[1]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  for (const [x, y] of hubs) {
    ctx.fillStyle = c.bg; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = c.fg; ctx.lineWidth = 1.4; ctx.stroke();
  }
};

const ridges: Draw = (ctx, w, h, c, seed) => {
  const n = makeNoise(seed);
  const lines = 46;
  const step = h / (lines + 6);
  for (let L = 0; L < lines; L++) {
    const base = step * (L + 5);
    const hot = L === 30;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const centre = 1 - Math.min(1, Math.abs(x - w / 2) / (w * 0.32));
      const amp = Math.pow(Math.max(0, centre), 1.6) * step * 7;
      const y = base - fbm(n, x / 70, L * 0.35) * amp;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fillStyle = c.bg; ctx.globalAlpha = 1; ctx.fill();
    ctx.strokeStyle = hot ? c.accent : c.fg;
    ctx.lineWidth = hot ? 1.8 : 1;
    ctx.stroke();
  }
};

const halftone: Draw = (ctx, w, h, c, seed) => {
  const n = makeNoise(seed);
  const gap = Math.max(8, Math.round(Math.min(w, h) / 48));
  const cx = w * 0.62, cy = h * 0.4, R = Math.min(w, h) * 0.42;
  for (let y = gap / 2; y < h + gap; y += gap) {
    for (let x = gap / 2; x < w + gap; x += gap) {
      const d = Math.hypot(x - cx, y - cy) / R;
      const tone = Math.max(0, 1 - d) * 0.85 + fbm(n, x / 160, y / 160) * 0.35 - 0.1;
      const r = Math.max(0, Math.min(1, tone)) * gap * 0.52;
      if (r < 0.4) continue;
      ctx.fillStyle = d < 0.18 ? c.accent : c.fg;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
};

const bars: Draw = (ctx, w, h, c, seed) => {
  const rand = rng(seed);
  const count = 34;
  const bw = w / count;
  const peak = Math.floor(count * 0.68);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const v = 0.15 + Math.pow(Math.sin(t * Math.PI * 0.9), 2) * 0.6 + rand() * 0.12;
    const bh = v * h * 0.82;
    ctx.fillStyle = i === peak ? c.accent : c.fg;
    ctx.globalAlpha = i === peak ? 1 : 0.85;
    ctx.fillRect(i * bw + bw * 0.18, h - bh, bw * 0.64, bh);
  }
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = c.fg;
  for (let y = h * 0.2; y < h; y += h * 0.2) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.setLineDash([2, 5]); ctx.stroke();
  }
  ctx.setLineDash([]);
};

const DRAW: Record<PlateKind, Draw> = { contour, plume, routes, ridges, halftone, bars };

export function Plate({ kind, seed = 7, tone = 'paper', className, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let lastW = 0, lastH = 0, timer = 0;

    const paint = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const colors = COLORS[tone];
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, w, h);
      DRAW[kind](ctx, w, h, colors, seed);
      ctx.globalAlpha = 1;
    };

    paint();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(paint, 120);
    });
    ro.observe(canvas);
    return () => { ro.disconnect(); window.clearTimeout(timer); };
  }, [kind, seed, tone]);

  return <canvas ref={ref} className={`plate ${className ?? ''}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

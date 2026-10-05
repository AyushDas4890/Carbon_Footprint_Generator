import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap';

const STEPS = [
  { num: '01', icon: '🧮', title: 'Input Product Details', desc: 'Material, weight, manufacturing country, transport mode and end-of-life — the five levers of a product’s lifecycle.' },
  { num: '02', icon: '🤖', title: 'ML Prediction', desc: 'XGBoost with quantile regression gives a point estimate, wrapped in a conformal 90% prediction interval.' },
  { num: '03', icon: '🌍', title: 'Actionable Insights', desc: 'SHAP shows which factors drive the number; the AI Advisor suggests grounded, cited ways to cut it.' },
];

const NODES = [
  { x: 40, y: 290, icon: '🌱', label: 'Raw material' },
  { x: 215, y: 120, icon: '🏭', label: 'Factory' },
  { x: 395, y: 260, icon: '🚢', label: 'Freight' },
  { x: 570, y: 95, icon: '🏬', label: 'Consumer' },
];
const ROUTE = 'M40,290 C115,290 135,120 215,120 S330,260 395,260 S505,95 570,95';

/**
 * Pinned, scroll-scrubbed motion graphic: the supply-chain route draws itself,
 * a parcel rides along it emitting CO₂ puffs at each stop, and the step cards
 * flip over in 3D as the story advances.
 */
export function SupplyChainStory() {
  const root = useRef<HTMLDivElement>(null);
  const route = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (prefersReducedMotion()) {
        gsap.set(q('.step-cards'), { height: 'auto', display: 'grid', gap: '1rem' });
        gsap.set(q('.step-card'), { position: 'relative', opacity: 1 });
        return;
      }
      gsap.set(q('.step-card'), { rotationY: 90, opacity: 0 });
      gsap.set(q('.step-card')[0], { rotationY: 0, opacity: 1 });
      gsap.set(q('.route-draw'), { drawSVG: '0%' });
      gsap.set(q('.node'), { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(q('.puff'), { scale: 0, opacity: 0, transformOrigin: '50% 50%' });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=220%', pin: true, scrub: 1 },
      });

      tl.to(q('.node')[0], { scale: 1, duration: 0.15, ease: 'back.out(2)' }, 0)
        .to(q('.route-draw'), { drawSVG: '100%', duration: 3 }, 0)
        .to(q('.parcel'), {
          motionPath: { path: route.current!, align: route.current!, alignOrigin: [0.5, 0.5], autoRotate: true },
          duration: 3,
        }, 0)
        .to(q('.progress-fill'), { scaleX: 1, duration: 3 }, 0);

      // Each later stop pops in, puffs CO₂ and advances the step card.
      [1, 2, 3].forEach((i) => {
        const at = i;
        tl.to(q('.node')[i], { scale: 1, duration: 0.15, ease: 'back.out(2)' }, at - 0.08)
          .fromTo(q(`.puff-${i}`), { scale: 0, opacity: 0.9, y: 0 },
            { scale: 1.6, opacity: 0, y: -40, duration: 0.5, stagger: 0.06, ease: 'power1.out' }, at - 0.08);
        if (i < STEPS.length) {
          tl.to(q('.step-card')[i - 1], { rotationY: -90, opacity: 0, duration: 0.3, ease: 'power2.in' }, at - 0.25)
            .to(q('.step-card')[i], { rotationY: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, at + 0.05)
            .to(q('.step-counter'), { innerText: i + 1, snap: { innerText: 1 }, duration: 0.01 }, at + 0.05);
        }
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="pin-stage">
      <div className="pin-grid">
        <div>
          <span className="eyebrow">Process</span>
          <h2 className="heading">From cradle to <span className="gradient-text">checkout</span></h2>
          <p className="lead" style={{ marginTop: '1rem' }}>Scroll to follow a product through its lifecycle — every stop adds emissions our model accounts for.</p>
          <svg className="route-svg" viewBox="0 0 610 360" style={{ marginTop: '1.5rem' }} aria-hidden>
            <defs>
              <linearGradient id="route-grad" x1="0" x2="1">
                <stop offset="0%" stopColor="#64ffb4" />
                <stop offset="55%" stopColor="#00d9ff" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="route-glow"><feGaussianBlur stdDeviation="4" /></filter>
            </defs>
            <path d={ROUTE} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="6 8" />
            <path className="route-draw" d={ROUTE} fill="none" stroke="url(#route-grad)" strokeWidth="8" opacity="0.35" filter="url(#route-glow)" />
            <path ref={route} className="route-draw" d={ROUTE} fill="none" stroke="url(#route-grad)" strokeWidth="3" strokeLinecap="round" />
            {NODES.map((n, i) => (
              <g key={n.label}>
                {[0, 1, 2].map((k) => (
                  <circle key={k} className={`puff puff-${i}`} cx={n.x + (k - 1) * 12} cy={n.y - 26} r={7 - k} fill="rgba(160,170,190,0.55)" />
                ))}
                <g className="node">
                  <circle className="route-node" cx={n.x} cy={n.y} r="22" />
                  <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize="20">{n.icon}</text>
                </g>
                <text className="route-label" x={n.x} y={n.y + 48} textAnchor="middle">{n.label}</text>
              </g>
            ))}
            <g className="parcel">
              <rect x="-11" y="-9" width="22" height="18" rx="4" fill="#64ffb4" />
              <path d="M-11,-2 H11 M0,-9 V9" stroke="#04110b" strokeWidth="1.5" />
            </g>
          </svg>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: '1rem' }}>
            <div className="progress-fill" style={{ height: '100%', background: 'var(--gradient-brand)', transform: 'scaleX(0)', transformOrigin: 'left', borderRadius: 2 }} />
          </div>
        </div>

        <div>
          <div className="secondary" style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
            Step <span className="step-counter">1</span> / {STEPS.length}
          </div>
          <div className="step-cards">
            {STEPS.map((s) => (
              <div key={s.num} className="step-card glass">
                <div className="step-num">{s.num}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="feature-title" style={{ fontSize: '1.4rem' }}>{s.title}</div>
                <p className="feature-desc" style={{ fontSize: '1rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

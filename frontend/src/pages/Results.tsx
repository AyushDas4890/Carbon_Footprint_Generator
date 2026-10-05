import { lazy, Suspense, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Doughnut } from 'react-chartjs-2';
import '../lib/charts';
import { loadResult, BREAKDOWN_PARTS } from '../lib/result';
import { CountUp } from '../components/motion-graphics/CountUp';
import { KineticHeading } from '../components/motion-graphics/KineticHeading';
import { TiltCard } from '../components/TiltCard';
import { MagneticButton } from '../components/MagneticButton';
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal';

const EmissionTowers = lazy(() => import('../three/EmissionTowers'));

const GRADE_COLORS: Record<string, string> = {
  A: '#64ffb4', B: '#9cf27a', C: '#f5d76e', D: '#ffa45c', E: '#ff6b35', F: '#ff4d6d',
};

export default function Results() {
  const stored = useMemo(loadResult, []);
  if (!stored) return <Navigate to="/" replace />;
  const { request, response: r } = stored;

  const parts = BREAKDOWN_PARTS.map((p) => ({ ...p, value: r.breakdown[p.key] }));
  const partsTotal = parts.reduce((s, p) => s + p.value, 0);
  const ci = r.confidence_interval;
  const grade = r.sustainability_rating?.grade ?? '—';
  const explanations = (r.explanations ?? []).filter((e) => !e.feature.startsWith('BASE')).slice(0, 6);
  const maxShap = Math.max(...explanations.map((e) => Math.abs(e.contribution_kg_co2)), 0.001);

  const offsets = [
    { icon: '🌳', title: 'Plant trees', desc: r.compensation?.message ?? 'Fund verified reforestation projects.' },
    { icon: '☀️', title: 'Renewable energy', desc: 'Fund solar/wind certificates that displace grid carbon.' },
    { icon: '♻️', title: 'Redesign material', desc: 'Recycled or bio-based alternatives can cut material emissions 30–60%.' },
    { icon: '🚢', title: 'Switch transport', desc: 'Moving freight from air to sea cuts transport emissions by up to ~95%.' },
  ];

  return (
    <div className="container page-pad">
      <span className="eyebrow">Analysis complete</span>
      <KineticHeading as="h1" className="heading" trigger="load" delay={0.6}>
        Carbon footprint <span className="gradient-text">results</span>
      </KineticHeading>

      <TiltCard intensity={5} style={{ marginTop: '2rem', padding: '2.5rem' }}>
        <div className="result-hero depth-1">
          <div>
            <div className="big-number gradient-text">
              <CountUp value={r.co2_kg} decimals={2} onView={false} />
            </div>
            <div className="secondary" style={{ marginTop: '0.5rem' }}>kg CO₂e — estimated lifecycle emissions</div>
            {ci && (
              <div className="ci-band" style={{ marginTop: '1rem' }}>
                📊 90% interval: <strong>{ci.lower.toFixed(2)}</strong> – <strong>{ci.upper.toFixed(2)}</strong> kg
              </div>
            )}
            <div className="muted" style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{request.product_name}</strong> · {request.material.replace(/_/g, ' ')} · {request.weight_kg} kg · {request.transport_mode} {request.transport_distance_km.toLocaleString()} km
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'flex-end', gap: '1.5rem' }}>
            <motion.div
              className="grade depth-2"
              style={{ background: GRADE_COLORS[grade] ?? 'var(--gradient-brand)' }}
              initial={{ rotateY: 180, scale: 0.4, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 1 }}
            >
              {grade}
            </motion.div>
            <div>
              <div style={{ fontWeight: 600 }}>{r.sustainability_rating?.label ?? 'Unrated'}</div>
              {r.sustainability_rating && (
                <div className="muted" style={{ fontSize: '0.85rem' }}>{r.sustainability_rating.intensity_kg_co2_per_kg.toFixed(2)} kg CO₂e per kg</div>
              )}
            </div>
          </div>
        </div>
      </TiltCard>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <Reveal>
          <div className="glass" style={{ height: '100%' }}>
            <div className="card-title">Emission breakdown — 3D</div>
            <div className="scene-wrap" style={{ height: 340 }}>
              <Suspense fallback={<div className="spinner" style={{ margin: '8rem auto' }} />}>
                <EmissionTowers towers={parts.map((p) => ({ label: p.label, value: p.value, color: p.color }))} />
              </Suspense>
            </div>
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.75rem' }}>
              Factor-based breakdown ({partsTotal.toFixed(2)} kg); the headline number is the ML model&rsquo;s estimate. Drag to orbit.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass" style={{ height: '100%' }}>
            <div className="card-title">Share of breakdown</div>
            {parts.map((p, i) => (
              <div className="bar-row" key={p.key}>
                <div className="bar-head"><span>{p.label}</span><span>{p.value.toFixed(2)} kg</span></div>
                <div className="bar-track">
                  <motion.div
                    className="bar-fill"
                    style={{ background: p.color }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: partsTotal > 0 ? p.value / partsTotal : 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
            <div style={{ maxWidth: 260, margin: '1.5rem auto 0' }}>
              <Doughnut
                data={{
                  labels: parts.map((p) => p.label),
                  datasets: [{ data: parts.map((p) => Math.max(p.value, 0)), backgroundColor: parts.map((p) => p.color), borderColor: '#050810', borderWidth: 3 }],
                }}
                options={{ cutout: '68%', plugins: { legend: { position: 'bottom' } }, animation: { animateRotate: true, duration: 1600 } }}
              />
            </div>
          </div>
        </Reveal>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <Reveal>
          <div className="glass" style={{ height: '100%' }}>
            <div className="card-title">What drives this number (SHAP)</div>
            {explanations.length === 0 && <p className="muted">SHAP explanations not available.</p>}
            {explanations.map((e, i) => {
              const v = e.contribution_kg_co2;
              const w = (Math.abs(v) / maxShap) * 50;
              return (
                <div className="shap-row" key={e.feature}>
                  <span className="secondary">{e.feature}</span>
                  <div className="shap-track">
                    <div style={{ position: 'absolute', left: '50%', top: -3, bottom: -3, width: 1, background: 'rgba(255,255,255,0.15)' }} />
                    <motion.div
                      className="shap-bar"
                      style={{ background: v >= 0 ? 'var(--ember)' : 'var(--cyan)', left: v >= 0 ? '50%' : `${50 - w}%`, width: `${w}%`, originX: v >= 0 ? 0 : 1 }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span style={{ color: v >= 0 ? 'var(--ember)' : 'var(--cyan)', textAlign: 'right' }}>{v >= 0 ? '+' : ''}{v.toFixed(2)}</span>
                </div>
              );
            })}
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: '0.5rem' }}>Orange pushes the estimate up, cyan pulls it down (kg CO₂e).</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass" style={{ height: '100%' }}>
            <div className="card-title">In real-world terms</div>
            {r.equivalency ? (
              <RevealGroup className="stack" stagger={0.12}>
                {[
                  { icon: '🚗', v: r.equivalency.car_km, d: 1, unit: 'km', label: 'driven in an average car' },
                  { icon: '📱', v: r.equivalency.smartphone_charges, d: 0, unit: '', label: 'smartphone charges' },
                  { icon: '🧺', v: r.equivalency.washing_loads, d: 1, unit: '', label: 'washing-machine loads' },
                  ...(r.compensation ? [{ icon: '🥗', v: r.compensation.days_vegan, d: 1, unit: 'days', label: 'of a vegan diet to offset' }] : []),
                ].map((q) => (
                  <RevealItem key={q.label}>
                    <div className="equiv">
                      <div className="equiv-icon">{q.icon}</div>
                      <div>
                        <div className="equiv-val"><CountUp value={q.v} decimals={q.d} suffix={q.unit ? ` ${q.unit}` : ''} /></div>
                        <div className="muted" style={{ fontSize: '0.85rem' }}>{q.label}</div>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            ) : (
              <p className="muted">Equivalencies not available.</p>
            )}
          </div>
        </Reveal>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <span className="eyebrow">Reduce it</span>
        <RevealGroup className="grid-4">
          {offsets.map((o) => (
            <RevealItem key={o.title}>
              <TiltCard style={{ height: '100%' }}>
                <div className="depth-2" style={{ fontSize: '1.8rem', marginBottom: '0.6rem' }}>{o.icon}</div>
                <div className="depth-1">
                  <div className="feature-title" style={{ fontSize: '0.95rem' }}>{o.title}</div>
                  <p className="feature-desc" style={{ fontSize: '0.82rem' }}>{o.desc}</p>
                </div>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>

      <div className="hero-ctas" style={{ marginTop: '2.5rem' }}>
        <MagneticButton to="/" variant="ghost">← New calculation</MagneticButton>
        <MagneticButton to="/insights/" variant="ghost">See insights</MagneticButton>
        <MagneticButton to="/advisor/">Ask AI Advisor →</MagneticButton>
      </div>
    </div>
  );
}

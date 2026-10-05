import { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { barOptions, PALETTE } from '../lib/charts';
import { api, type ModelInfo } from '../lib/api';
import { loadResult, BREAKDOWN_PARTS } from '../lib/result';
import { KineticHeading } from '../components/motion-graphics/KineticHeading';
import { CountUp } from '../components/motion-graphics/CountUp';
import { MagneticButton } from '../components/MagneticButton';
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal';
import { TiltCard } from '../components/TiltCard';

// Reference intensities (kg CO₂e per kg) from predictor/training/real_factors.json.
const MATERIAL_BENCH: Record<string, number> = {
  Cotton: 5.5, Polyester: 6.2, Steel: 2.85, Aluminum: 8.2, Plastic: 2.57, Wood: 0.27, Glass: 1.4, Beef: 66.39,
};
// kg CO₂e per kg per 1000 km.
const TRANSPORT_BENCH = { Road: 0.107, Rail: 0.028, Sea: 0.015, Air: 1.099 };

export default function Insights() {
  const stored = useMemo(loadResult, []);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [modelError, setModelError] = useState('');

  useEffect(() => {
    api.modelInfo().then(setModel).catch((e: Error) => setModelError(e.message));
  }, []);

  return (
    <div className="container page-pad">
      <span className="eyebrow">Analytics</span>
      <KineticHeading as="h1" className="heading" trigger="load" delay={0.6}>
        Carbon <span className="gradient-text">insights</span>
      </KineticHeading>
      <p className="lead" style={{ marginTop: '0.75rem' }}>Your most recent prediction, benchmarked against materials and transport modes, with its uncertainty band.</p>

      {model && (
        <RevealGroup className="grid-4" stagger={0.08}>
          {[
            { label: 'Model', node: <span style={{ fontSize: '0.95rem' }}>{model.model_family}</span> },
            { label: 'R² (held-out)', node: <CountUp value={model.r2_score} decimals={3} onView={false} /> },
            { label: 'MAE', node: <CountUp value={model.mae} decimals={2} suffix=" kg" onView={false} /> },
            { label: 'Conformal coverage', node: model.conformal_coverage_90 != null ? <CountUp value={model.conformal_coverage_90 * 100} decimals={1} suffix="%" onView={false} /> : '—' },
          ].map((c) => (
            <RevealItem key={c.label}>
              <div className="glass" style={{ marginTop: '2rem', padding: '1.25rem 1.5rem' }}>
                <div className="muted" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--green)' }}>{c.node}</div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
      {modelError && <div className="error-box" style={{ marginTop: '2rem' }}>Model info unavailable: {modelError}</div>}

      {!stored ? (
        <Reveal>
          <TiltCard className="empty" style={{ maxWidth: 560, margin: '3rem auto' }}>
            <div className="empty-icon depth-2">📊</div>
            <div className="depth-1">
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.6rem' }}>No prediction yet</h2>
              <p className="secondary" style={{ marginBottom: '1.75rem' }}>
                Make your first prediction and your personalised KPIs, benchmarks and uncertainty band will appear here.
              </p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <MagneticButton to="/">Start a prediction</MagneticButton>
                <MagneticButton to="/compare/" variant="ghost">Compare products</MagneticButton>
              </div>
            </div>
          </TiltCard>
        </Reveal>
      ) : (
        <Dashboard stored={stored} />
      )}
    </div>
  );
}

function Dashboard({ stored }: { stored: NonNullable<ReturnType<typeof loadResult>> }) {
  const r = stored.response;
  const val = r.co2_kg;
  const bd = r.breakdown;
  const ci = r.confidence_interval;
  const parts = BREAKDOWN_PARTS.map((p) => ({ ...p, value: bd[p.key] }));

  const kpis = [
    { icon: '📦', value: val, decimals: 2, suffix: '', label: 'Carbon footprint (kg CO₂e)' },
    { icon: '⚡', value: bd.materials_percent, decimals: 0, suffix: '%', label: 'Material share of breakdown' },
    { icon: '🚢', value: bd.transport_percent, decimals: 0, suffix: '%', label: 'Transport share of breakdown' },
    { icon: '🎯', value: ci ? ci.upper - ci.lower : 0, decimals: 2, suffix: ' kg', label: '90% interval width' },
  ];

  return (
    <>
      <RevealGroup className="grid-4" stagger={0.1}>
        {kpis.map((k) => (
          <RevealItem key={k.label}>
            <TiltCard style={{ marginTop: '1.5rem' }}>
              <div className="depth-2" style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>{k.icon}</div>
              <div className="depth-1">
                <CountUp className="stat-value gradient-text" value={k.value} decimals={k.decimals} suffix={k.suffix} />
                <div className="stat-label" style={{ textAlign: 'left' }}>{k.label}</div>
              </div>
            </TiltCard>
          </RevealItem>
        ))}
      </RevealGroup>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <Reveal>
          <div className="glass">
            <div className="card-title">Emission breakdown (kg CO₂e)</div>
            <Bar
              data={{ labels: parts.map((p) => p.label), datasets: [{ label: 'kg CO₂e', data: parts.map((p) => p.value), backgroundColor: parts.map((p) => p.color), borderRadius: 8, borderSkipped: false }] }}
              options={barOptions({ plugins: { legend: { display: false } } })}
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass">
            <div className="card-title">Material benchmark (kg CO₂e per kg)</div>
            <Bar
              data={{
                labels: Object.keys(MATERIAL_BENCH),
                datasets: [{
                  label: 'kg CO₂e per kg',
                  data: Object.values(MATERIAL_BENCH),
                  backgroundColor: Object.keys(MATERIAL_BENCH).map((m) => (m === stored.request.material ? 'rgba(255,107,53,0.85)' : 'rgba(100,255,180,0.55)')),
                  borderRadius: 6, borderSkipped: false,
                }],
              }}
              options={barOptions({ indexAxis: 'y', plugins: { legend: { display: false } } })}
            />
          </div>
        </Reveal>
        <Reveal>
          <div className="glass">
            <div className="card-title">Transport benchmark (kg CO₂e per kg per 1000 km)</div>
            <Bar
              data={{ labels: Object.keys(TRANSPORT_BENCH), datasets: [{ label: 'kg CO₂e', data: Object.values(TRANSPORT_BENCH), backgroundColor: PALETTE.slice(0, 4), borderRadius: 6, borderSkipped: false }] }}
              options={barOptions({ plugins: { legend: { display: false } } })}
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="glass">
            <div className="card-title">Uncertainty band (conformal 90%)</div>
            {ci ? (
              <Bar
                data={{
                  labels: ['Lower bound', 'Point estimate', 'Upper bound'],
                  datasets: [{ label: 'kg CO₂e', data: [ci.lower, val, ci.upper], backgroundColor: ['rgba(100,255,180,0.35)', 'rgba(100,255,180,0.85)', 'rgba(100,255,180,0.35)'], borderRadius: 8, borderSkipped: false }],
                }}
                options={barOptions({ plugins: { legend: { display: false } } })}
              />
            ) : (
              <p className="muted">This prediction has no interval.</p>
            )}
          </div>
        </Reveal>
      </div>
    </>
  );
}

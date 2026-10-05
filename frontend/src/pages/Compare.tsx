import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bar } from 'react-chartjs-2';
import { barOptions } from '../lib/charts';
import { api, COUNTRIES, TRANSPORT_MODES, type CompareResponse, type Country, type PredictRequest, type TransportMode } from '../lib/api';
import { KineticHeading } from '../components/motion-graphics/KineticHeading';
import { CountUp } from '../components/motion-graphics/CountUp';
import { MagneticButton } from '../components/MagneticButton';
import { TiltCard } from '../components/TiltCard';

type Side = 'A' | 'B';
const SIDE_COLOR: Record<Side, string> = { A: 'var(--green)', B: 'var(--violet)' };
const SIDE_FILL: Record<Side, string> = { A: 'rgba(100,255,180,0.7)', B: 'rgba(139,92,246,0.7)' };

const initial = (side: Side, material: string, mode: TransportMode, distance: number): PredictRequest => ({
  product_name: `Product ${side}`, material, weight_kg: 1, transport_mode: mode,
  transport_distance_km: distance, country: 'CHINA', eol: 'LANDFILL',
});

function ProductForm({ side, value, onChange, materials }: {
  side: Side; value: PredictRequest; onChange: (v: PredictRequest) => void; materials: string[];
}) {
  const set = <K extends keyof PredictRequest>(k: K, v: PredictRequest[K]) => onChange({ ...value, [k]: v });
  return (
    <TiltCard intensity={6}>
      <div className="depth-1">
        <div className="row" style={{ marginBottom: '1.25rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: SIDE_COLOR[side] }} />
          <input className="input" aria-label={`Product ${side} name`} value={value.product_name} onChange={(e) => set('product_name', e.target.value)} style={{ flex: 1 }} />
        </div>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor={`mat${side}`}>Material</label>
            <select id={`mat${side}`} className="select" value={value.material} onChange={(e) => set('material', e.target.value)}>
              {materials.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor={`country${side}`}>Country</label>
            <select id={`country${side}`} className="select" value={value.country} onChange={(e) => set('country', e.target.value as Country)}>
              {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor={`w${side}`}>Weight <span className="value">{value.weight_kg.toFixed(1)} kg</span></label>
          <input id={`w${side}`} type="range" className="range" min={0.1} max={50} step={0.1} value={value.weight_kg} onChange={(e) => set('weight_kg', parseFloat(e.target.value))} />
        </div>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor={`tr${side}`}>Transport</label>
            <select id={`tr${side}`} className="select" value={value.transport_mode} onChange={(e) => set('transport_mode', e.target.value as TransportMode)}>
              {TRANSPORT_MODES.map((m) => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor={`d${side}`}>Distance <span className="value">{value.transport_distance_km.toLocaleString()} km</span></label>
            <input id={`d${side}`} type="range" className="range" min={50} max={20000} step={50} value={value.transport_distance_km} onChange={(e) => set('transport_distance_km', parseFloat(e.target.value))} />
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

export default function Compare() {
  const [materials, setMaterials] = useState<string[]>([]);
  const [a, setA] = useState(() => initial('A', 'Cotton', 'SEA', 1000));
  const [b, setB] = useState(() => initial('B', 'Polyester', 'AIR', 5000));
  const [compared, setCompared] = useState<{ res: CompareResponse; names: Record<Side, string> } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.materials().then(setMaterials).catch((e: Error) => setError(`Could not load materials: ${e.message}`));
  }, []);

  const run = async () => {
    setError('');
    setLoading(true);
    // The API ranks rows by CO₂ and identifies them by name, so names must differ.
    const nameA = a.product_name.trim() || 'Product A';
    let nameB = b.product_name.trim() || 'Product B';
    if (nameB === nameA) nameB = `${nameB} (B)`;
    try {
      const res = await api.compare([{ ...a, product_name: nameA }, { ...b, product_name: nameB }]);
      setCompared({ res, names: { A: nameA, B: nameB } });
    } catch (e) {
      setError((e as Error).message);
      setCompared(null);
    } finally {
      setLoading(false);
    }
  };

  const result = compared?.res;
  const ra = result?.rankings.find((r) => r.product_name === compared?.names.A);
  const rb = result?.rankings.find((r) => r.product_name === compared?.names.B);
  const winnerSide: Side | null = ra && rb ? (ra.co2_kg < rb.co2_kg ? 'A' : rb.co2_kg < ra.co2_kg ? 'B' : null) : null;

  return (
    <div className="container page-pad">
      <span className="eyebrow">Side-by-side</span>
      <KineticHeading as="h1" className="heading" trigger="load" delay={0.6}>
        Compare <span className="gradient-text">products</span>
      </KineticHeading>
      <p className="lead" style={{ marginTop: '0.75rem', marginBottom: '2.5rem' }}>Configure two products and run both through the model.</p>

      <div className="compare-grid">
        <ProductForm side="A" value={a} onChange={setA} materials={materials} />
        <div className="vs">
          <motion.div className="vs-orb" animate={{ rotate: loading ? 360 : 0, scale: loading ? [1, 1.15, 1] : 1 }} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>VS</motion.div>
        </div>
        <ProductForm side="B" value={b} onChange={setB} materials={materials} />
      </div>

      <div className="text-center" style={{ marginTop: '2rem' }}>
        <MagneticButton onClick={run} disabled={loading || !materials.length}>{loading ? 'Comparing…' : '⚖️ Compare now'}</MagneticButton>
      </div>
      {error && <div className="error-box" style={{ marginTop: '1.5rem' }}>{error}</div>}

      <AnimatePresence>
        {ra && rb && (
          <motion.div key={`${ra.co2_kg}-${rb.co2_kg}`} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <div className="grid-2" style={{ marginTop: '2rem', perspective: 1200 }}>
              {([['A', ra], ['B', rb]] as const).map(([side, row], i) => (
                <motion.div
                  key={side}
                  className="glass text-center"
                  style={{ borderColor: winnerSide === side ? SIDE_COLOR[side] : undefined }}
                  initial={{ rotateY: i === 0 ? -60 : 60, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 90, damping: 14, delay: i * 0.15 }}
                >
                  <div className="muted" style={{ fontSize: '0.85rem' }}>{row.product_name}</div>
                  <div className="big-number" style={{ fontSize: '3rem', color: SIDE_COLOR[side] }}>
                    <CountUp value={row.co2_kg} decimals={2} onView={false} />
                  </div>
                  <div className="secondary" style={{ fontSize: '0.85rem' }}>kg CO₂e · grade {row.rating?.grade ?? '—'}</div>
                  {winnerSide === side && <motion.div className="pill" style={{ marginTop: '0.75rem', color: SIDE_COLOR[side] }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}>🏆 Lower impact</motion.div>}
                </motion.div>
              ))}
            </div>
            <motion.div
              className="winner glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: winnerSide ? SIDE_COLOR[winnerSide] : 'var(--text-secondary)' }}
            >
              {winnerSide
                ? <>✅ <strong>{result?.winner}</strong> is the lower-impact choice — <strong>{result?.loser}</strong> emits {result?.spread_pct}% more.</>
                : '⚖️ Both products have equal carbon footprints.'}
            </motion.div>
            <div className="glass" style={{ marginTop: '1.5rem' }}>
              <div className="card-title">Emission comparison (kg CO₂e)</div>
              <Bar
                data={{
                  labels: ['Material', 'Manufacturing', 'Transport'],
                  datasets: ([['A', ra], ['B', rb]] as const).map(([side, row]) => ({
                    label: row.product_name,
                    data: [row.breakdown.material_co2, row.breakdown.manufacturing_co2, row.breakdown.transport_co2],
                    backgroundColor: SIDE_FILL[side], borderRadius: 6, borderSkipped: false,
                  })),
                }}
                options={barOptions()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

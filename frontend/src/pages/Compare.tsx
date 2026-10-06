import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { api, COUNTRIES, TRANSPORT_MODES, type CompareResponse, type Country, type PredictRequest, type TransportMode } from '../lib/api';
import { prettyMaterial } from '../lib/result';
import { Button } from '../components/ui/Button';
import { CountUp } from '../components/ui/CountUp';
import { PageHead } from '../components/ui/PageHead';
import { Range } from '../components/ui/Range';
import { Segmented } from '../components/ui/Segmented';
import { GroupedBars } from '../components/ui/Charts';

type Side = 'A' | 'B';
const SIDE_COLOR: Record<Side, string> = { A: 'var(--series-1)', B: 'var(--series-2)' };

const initial = (side: Side, material: string, mode: TransportMode, distance: number): PredictRequest => ({
  product_name: `Product ${side}`, material, weight_kg: 1, transport_mode: mode,
  transport_distance_km: distance, country: 'CHINA', eol: 'LANDFILL',
});

function ProductForm({ side, value, onChange, materials }: {
  side: Side; value: PredictRequest; onChange: (v: PredictRequest) => void; materials: string[];
}) {
  const set = <K extends keyof PredictRequest>(k: K, v: PredictRequest[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="panel">
      <div className="panel-head mono">
        <span className="row-inline"><span className="legend-swatch" style={{ background: SIDE_COLOR[side] }} />Product {side}</span>
      </div>
      <div className="field">
        <label className="label" htmlFor={`name${side}`}>Name</label>
        <input id={`name${side}`} className="input" value={value.product_name} onChange={(e) => set('product_name', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <label className="label" htmlFor={`mat${side}`}>Material</label>
          <select id={`mat${side}`} className="select" value={value.material} onChange={(e) => set('material', e.target.value)}>
            {materials.map((m) => <option key={m} value={m}>{prettyMaterial(m)}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor={`country${side}`}>Made in</label>
          <select id={`country${side}`} className="select" value={value.country} onChange={(e) => set('country', e.target.value as Country)}>
            {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <Range id={`w${side}`} label="Weight" value={value.weight_kg} min={0.1} max={50} step={0.1} format={(v) => `${v.toFixed(1)} kg`} onChange={(v) => set('weight_kg', v)} />
      <div className="field">
        <span className="label">Freight</span>
        <Segmented id={`tr${side}`} label={`Product ${side} transport mode`} value={value.transport_mode} options={TRANSPORT_MODES} onChange={(v) => set('transport_mode', v)} />
      </div>
      <Range id={`d${side}`} label="Distance" value={value.transport_distance_km} min={50} max={20000} step={50} format={(v) => `${v.toLocaleString()} km`} onChange={(v) => set('transport_distance_km', v)} />
    </div>
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
      <PageHead
        index="C—01"
        eyebrow="Compare"
        title={<>Two products, <em>one verdict</em></>}
        lead="Configure both sides and run them through the same model. You get the lighter option, the gap, and where the gap comes from."
      />

      <div className="compare-grid">
        <ProductForm side="A" value={a} onChange={setA} materials={materials} />
        <div className="vs">
          <motion.span
            className="vs-mark"
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { duration: 1.2, repeat: Infinity, ease: 'linear' } : { type: 'spring' }}
          >
            vs
          </motion.span>
        </div>
        <ProductForm side="B" value={b} onChange={setB} materials={materials} />
      </div>

      <div className="cta-row cta-center">
        <Button onClick={run} variant="accent" disabled={loading || !materials.length}>{loading ? 'Comparing…' : 'Compare now'}</Button>
      </div>
      {error && <div className="error-box" role="alert">{error}</div>}

      <AnimatePresence>
        {ra && rb && (
          <motion.section
            key={`${ra.co2_kg}-${rb.co2_kg}`}
            className="results-section"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="section-label mono"><span>02</span>Verdict</div>
            <p className="verdict">
              {winnerSide
                ? <><em>{result?.winner}</em> is the lighter choice. {result?.loser} emits {result?.spread_pct}% more.</>
                : 'Both products have the same footprint.'}
            </p>
            <div className="duel">
              {([['A', ra], ['B', rb]] as const).map(([side, row]) => (
                <div key={side} className={`duel-side${winnerSide === side ? ' is-winner' : ''}`}>
                  <span className="mono row-inline"><span className="legend-swatch" style={{ background: SIDE_COLOR[side] }} />{row.product_name}</span>
                  <div className="duel-number"><CountUp value={row.co2_kg} decimals={2} onView={false} /><span>kg CO₂e</span></div>
                  <span className="mono muted">Grade {row.rating?.grade ?? '—'}{winnerSide === side ? ' · lighter' : ''}</span>
                </div>
              ))}
            </div>
            <div className="results-grid" style={{ marginTop: '3rem' }}>
              <h2 className="heading-sm">Where the <em>gap</em> comes from</h2>
              <GroupedBars
                unit="kg CO₂e"
                categories={['Material', 'Manufacturing', 'Transport']}
                series={([['A', ra], ['B', rb]] as const).map(([side, row]) => ({
                  name: row.product_name,
                  color: SIDE_COLOR[side],
                  values: [row.breakdown.material_co2, row.breakdown.manufacturing_co2, row.breakdown.transport_co2],
                }))}
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

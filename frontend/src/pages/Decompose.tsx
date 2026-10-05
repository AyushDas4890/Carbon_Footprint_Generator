import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Doughnut } from 'react-chartjs-2';
import { PALETTE } from '../lib/charts';
import { api, COUNTRIES, END_OF_LIFE, type BomResponse, type Country, type EndOfLife } from '../lib/api';
import { KineticHeading } from '../components/motion-graphics/KineticHeading';
import { CountUp } from '../components/motion-graphics/CountUp';
import { MagneticButton } from '../components/MagneticButton';
import { TiltCard } from '../components/TiltCard';

const EXAMPLES = [
  'A stainless steel water bottle with a bamboo lid, made in China, shipped by sea to Europe.',
  'A cotton hoodie with polyester drawstrings, made in India, shipped by air to the UK.',
  'A wooden chair with steel screws and a leather seat, made in Germany, trucked within Europe.',
];

export default function Decompose() {
  const [desc, setDesc] = useState('');
  const [country, setCountry] = useState<Country>('CHINA');
  const [eol, setEol] = useState<EndOfLife>('LANDFILL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bom, setBom] = useState<BomResponse | null>(null);

  const run = async () => {
    if (!desc.trim()) {
      setError('Please enter a product description.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      setBom(await api.decompose(desc.trim(), country, eol));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const shareColor = (pct: number) => (pct > 30 ? 'var(--ember)' : pct > 15 ? 'var(--cyan)' : 'var(--green)');

  return (
    <div className="container page-pad">
      <span className="eyebrow">BoM intelligence</span>
      <KineticHeading as="h1" className="heading" trigger="load" delay={0.6}>
        Product <span className="gradient-text">decomposer</span>
      </KineticHeading>
      <p className="lead" style={{ marginTop: '0.75rem', marginBottom: '2.5rem' }}>
        Describe any product — the AI breaks it into a Bill of Materials and estimates each component&rsquo;s footprint.
      </p>

      <div className="split-layout">
        <div className="sticky">
          <TiltCard intensity={5}>
            <div className="depth-1">
              <div className="field">
                <label className="label" htmlFor="desc">Describe the product <span className="muted">{desc.length}/500</span></label>
                <textarea id="desc" className="textarea" maxLength={500} rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={EXAMPLES[0]} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {EXAMPLES.map((ex) => (
                  <button key={ex} type="button" className="chip" onClick={() => setDesc(ex)}>{ex.split(',')[0]}</button>
                ))}
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="dCountry">Country</label>
                  <select id="dCountry" className="select" value={country} onChange={(e) => setCountry(e.target.value as Country)}>
                    {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="dEol">End-of-life</label>
                  <select id="dEol" className="select" value={eol} onChange={(e) => setEol(e.target.value as EndOfLife)}>
                    {END_OF_LIFE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <MagneticButton block onClick={run} disabled={loading}>{loading ? 'Decomposing…' : '📦 Decompose product'}</MagneticButton>
            </div>
          </TiltCard>
        </div>

        <div>
          {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" className="glass empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p className="secondary">Decomposing into components…</p>
              </motion.div>
            ) : bom ? (
              <motion.div key={bom.product_name + bom.total_co2_kg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  className="glass text-center"
                  style={{ borderColor: 'rgba(100,255,180,0.35)' }}
                  initial={{ scale: 0.8, rotateX: 40, opacity: 0 }}
                  animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 110, damping: 14 }}
                >
                  <div className="muted" style={{ fontSize: '0.85rem' }}>{bom.product_name}</div>
                  <div className="big-number gradient-text" style={{ fontSize: '3.2rem' }}><CountUp value={bom.total_co2_kg} decimals={2} onView={false} /></div>
                  <div className="secondary" style={{ fontSize: '0.85rem' }}>Total product footprint (kg CO₂e)</div>
                </motion.div>
                {/* Connector line that draws down to the component list */}
                <motion.div style={{ width: 2, height: 32, margin: '0 auto', background: 'linear-gradient(var(--green), transparent)', originY: 0 }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 }} />
                <motion.div className="stack" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.4 } } }}>
                  {bom.components.map((c, i) => (
                    <motion.div
                      key={`${c.role}-${i}`}
                      className="bom-node"
                      variants={{ hidden: { opacity: 0, x: -40, rotateY: -25 }, show: { opacity: 1, x: 0, rotateY: 0 } }}
                      transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                      style={{ transformPerspective: 900 }}
                    >
                      <div className="bom-head">
                        <span className="bom-dot" style={{ background: shareColor(c.percent_of_total) }} />
                        <strong>{c.role || c.material}</strong>
                        <span className="badge">{c.material.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="row" style={{ alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>{c.co2_kg.toFixed(2)}</span>
                        <span className="muted" style={{ fontSize: '0.8rem' }}>kg CO₂e</span>
                        <span className="muted" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>{c.percent_of_total.toFixed(1)}% · {c.weight_kg} kg</span>
                      </div>
                      <div className="bar-track" style={{ height: 4, marginTop: '0.6rem' }}>
                        <motion.div className="bar-fill" style={{ background: shareColor(c.percent_of_total) }} initial={{ scaleX: 0 }} animate={{ scaleX: c.percent_of_total / 100 }} transition={{ delay: 0.6 + i * 0.09, duration: 0.9 }} />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                <div className="glass" style={{ marginTop: '1.5rem' }}>
                  <div className="card-title">Component breakdown</div>
                  <div style={{ maxWidth: 320, margin: '0 auto' }}>
                    <Doughnut
                      data={{
                        labels: bom.components.map((c) => c.role || c.material),
                        datasets: [{ data: bom.components.map((c) => c.co2_kg), backgroundColor: PALETTE, borderColor: '#050810', borderWidth: 3 }],
                      }}
                      options={{ cutout: '60%', plugins: { legend: { position: 'bottom' } } }}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" className="glass empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div className="empty-icon" animate={{ y: [0, -10, 0], rotate: [0, -6, 6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>📦</motion.div>
                <p className="secondary">Enter a product description and click Decompose to see the Bill of Materials analysis.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

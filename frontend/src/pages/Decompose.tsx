import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { api, COUNTRIES, END_OF_LIFE, type BomResponse, type Country, type EndOfLife } from '../lib/api';
import { prettyMaterial } from '../lib/result';
import { Plate } from '../components/Plate';
import { Button } from '../components/ui/Button';
import { CountUp } from '../components/ui/CountUp';
import { PageHead } from '../components/ui/PageHead';
import { Segmented } from '../components/ui/Segmented';
import { StackBar } from '../components/ui/Charts';

const EXAMPLES = [
  'A stainless steel water bottle with a bamboo lid, made in China, shipped by sea to Europe.',
  'A cotton hoodie with polyester drawstrings, made in India, shipped by air to the UK.',
  'A wooden chair with steel screws and a leather seat, made in Germany, trucked within Europe.',
];

// Fixed categorical order (validated for colour-blind separation); anything past it folds into "Other".
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)'];

function composition(bom: BomResponse) {
  const parts = bom.components.map((c, i) => ({ label: c.role || prettyMaterial(c.material), value: c.co2_kg, color: SERIES[i] }));
  if (parts.length <= SERIES.length) return parts;
  const rest = parts.slice(SERIES.length - 1);
  return [
    ...parts.slice(0, SERIES.length - 1),
    { label: `Other (${rest.length})`, value: rest.reduce((s, p) => s + p.value, 0), color: 'var(--ink-40)' },
  ];
}

export default function Decompose() {
  const [desc, setDesc] = useState('');
  const [country, setCountry] = useState<Country>('CHINA');
  const [eol, setEol] = useState<EndOfLife>('LANDFILL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bom, setBom] = useState<BomResponse | null>(null);

  const run = async () => {
    if (!desc.trim()) {
      setError('Describe the product first.');
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

  return (
    <div className="container page-pad">
      <PageHead
        index="D—01"
        eyebrow="Decompose"
        title={<>From a sentence to a <em>bill of materials</em></>}
        lead="Describe any product. An LLM splits it into components, and the model prices each one in CO₂e."
      />

      <div className="split">
        <div className="split-side">
          <div className="panel">
            <div className="field">
              <label className="label" htmlFor="desc">
                <span>Describe the product</span>
                <span className="label-value mono">{desc.length}/500</span>
              </label>
              <textarea id="desc" className="textarea" maxLength={500} rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={EXAMPLES[0]} />
            </div>
            <div className="chips">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => setDesc(ex)}>{ex.split(',')[0].replace(/^An? /, '')}</button>
              ))}
            </div>
            <div className="field">
              <label className="label" htmlFor="dCountry">Made in</label>
              <select id="dCountry" className="select" value={country} onChange={(e) => setCountry(e.target.value as Country)}>
                {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="label">End of life</span>
              <Segmented id="d-eol" label="End of life" value={eol} options={END_OF_LIFE} onChange={setEol} />
            </div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <Button variant="accent" block onClick={run} disabled={loading}>{loading ? 'Decomposing…' : 'Decompose product'}</Button>
          </div>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" className="bom-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="loader" aria-hidden><span /><span /><span /></div>
                <p className="mono">Splitting into components</p>
              </motion.div>
            ) : bom ? (
              <motion.div key={bom.product_name + bom.total_co2_kg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bom-total">
                  <span className="mono">{bom.product_name}</span>
                  <div className="duel-number"><CountUp value={bom.total_co2_kg} decimals={2} onView={false} /><span>kg CO₂e total</span></div>
                </div>
                <StackBar parts={composition(bom)} unit="kg" />
                <motion.ol className="bom-list" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}>
                  {bom.components.map((c, i) => (
                    <motion.li
                      key={`${c.role}-${i}`}
                      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <span className="mono bom-idx">{String(i + 1).padStart(2, '0')}</span>
                      <div className="bom-what">
                        <strong>{c.role || prettyMaterial(c.material)}</strong>
                        <span className="mono muted">{prettyMaterial(c.material)} · {c.weight_kg} kg</span>
                      </div>
                      <div className="bom-num">
                        <span>{c.co2_kg.toFixed(2)}</span>
                        <span className="mono muted">{c.percent_of_total.toFixed(1)}%</span>
                      </div>
                    </motion.li>
                  ))}
                </motion.ol>
              </motion.div>
            ) : (
              <motion.div key="empty" className="bom-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bom-empty-art"><Plate kind="ridges" seed={31} /></div>
                <p className="muted">The bill of materials appears here once you decompose a product.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

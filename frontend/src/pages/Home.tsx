import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { api, COUNTRIES, END_OF_LIFE, TRANSPORT_MODES, type Country, type EndOfLife, type TransportMode } from '../lib/api';
import { prettyMaterial, saveResult } from '../lib/result';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { AtomicGlobe } from '../components/kit/AtomicGlobe';
import { ScrollZoomReveal } from '../components/kit/ScrollZoomReveal';
import { ImageScroller, type ScrollerItem } from '../components/kit/ImageScroller';
import { SplitHeading, TextRevealOnScroll } from '../components/kit/TextReveal';
import { VerticalDialNav } from '../components/kit/VerticalDialNav';
import { Plate } from '../components/Plate';
import { Button } from '../components/ui/Button';
import { CountUp } from '../components/ui/CountUp';
import { Range } from '../components/ui/Range';
import { Segmented } from '../components/ui/Segmented';

const SECTIONS = [
  { id: 'intro', label: 'Intro' },
  { id: 'why', label: 'Why' },
  { id: 'model', label: 'Model' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'tools', label: 'Tools' },
  { id: 'start', label: 'Start' },
];

const TOOLS: ScrollerItem[] = [
  { index: '01', tag: 'Predict', to: '#calculate', title: 'Instant estimates', image: <Plate kind="contour" seed={3} />,
    body: 'Material, weight, origin, freight and end-of-life in; a calibrated CO₂e figure out, from a locally served XGBoost model in under 100 ms.' },
  { index: '02', tag: 'Explain', to: '/insights/', title: 'Explanations that add up', image: <Plate kind="bars" seed={11} />,
    body: 'TreeSHAP splits every estimate into per-feature contributions, so you see which choice pushed the number up and which pulled it down.' },
  { index: '03', tag: 'Advise', to: '/advisor/', title: 'A grounded advisor', image: <Plate kind="halftone" seed={5} />,
    body: 'Retrieval over LCA and IPCC sources, cross-encoder reranking and streamed answers that cite where every claim came from.' },
  { index: '04', tag: 'Decompose', to: '/decompose/', title: 'Bill-of-materials decomposer', image: <Plate kind="ridges" seed={8} />,
    body: 'Describe a product in plain language; an LLM breaks it into components and the model prices each one in CO₂e.' },
  { index: '05', tag: 'Compare', to: '/compare/', title: 'Side-by-side compare', image: <Plate kind="routes" seed={21} />,
    body: 'Run two products through the same model and see which is lighter, by how much, and exactly where the gap comes from.' },
  { index: '06', tag: 'Calibrate', to: '/insights/', title: 'Honest uncertainty', image: <Plate kind="plume" seed={2} />,
    body: 'Conformalized quantile regression wraps each estimate in a 90% interval that holds on unseen products.' },
];

function Calculator({ materials, loadError }: { materials: string[]; loadError: string }) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_name: '',
    material: '',
    country: 'CHINA' as Country,
    weight_kg: 1,
    transport_mode: 'SEA' as TransportMode,
    eol: 'LANDFILL' as EndOfLife,
    transport_distance_km: 1000,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setLoading(true);
    const request = { ...form, product_name: form.product_name.trim() || 'Unnamed product' };
    try {
      const response = await api.predict(request);
      saveResult({ request, response });
      navigate('/results/');
    } catch (err) {
      setSubmitError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="panel calc">
      <div className="panel-head mono">
        <span>Product sheet</span>
        <span>{loading ? 'Running model…' : 'XGBoost · conformal 90%'}</span>
      </div>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" className="calc-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="loader" aria-hidden><span /><span /><span /></div>
            <p className="mono">Estimating lifecycle emissions</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="field">
              <label className="label" htmlFor="productName">Product name</label>
              <input id="productName" className="input" placeholder="Cotton T-shirt" value={form.product_name} onChange={(e) => set('product_name', e.target.value)} maxLength={200} />
            </div>
            <div className="form-row">
              <div className="field">
                <label className="label" htmlFor="material">Material</label>
                <select id="material" className="select" required value={form.material} onChange={(e) => set('material', e.target.value)}>
                  <option value="">{materials.length ? 'Select material' : 'Loading…'}</option>
                  {materials.map((m) => <option key={m} value={m}>{prettyMaterial(m)}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="country">Made in</label>
                <select id="country" className="select" value={form.country} onChange={(e) => set('country', e.target.value as Country)}>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <Range id="weight" label="Weight" value={form.weight_kg} min={0.1} max={50} step={0.1} format={(v) => `${v.toFixed(1)} kg`} onChange={(v) => set('weight_kg', v)} />
            <div className="field">
              <span className="label">Freight</span>
              <Segmented id="transport" label="Transport mode" value={form.transport_mode} options={TRANSPORT_MODES} onChange={(v) => set('transport_mode', v)} />
            </div>
            <Range id="distance" label="Distance" value={form.transport_distance_km} min={50} max={20000} step={50} format={(v) => `${v.toLocaleString()} km`} onChange={(v) => set('transport_distance_km', v)} />
            <div className="field">
              <span className="label">End of life</span>
              <Segmented id="eol" label="End of life" value={form.eol} options={END_OF_LIFE} onChange={(v) => set('eol', v)} />
            </div>
            {(loadError || submitError) && <div className="error-box" role="alert">{loadError || submitError}</div>}
            <Button type="submit" variant="accent" block disabled={!form.material}>Calculate footprint</Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const hero = useRef<HTMLElement>(null);
  const globeProgress = useRef(0);
  const [materials, setMaterials] = useState<string[]>([]);
  const [coverage, setCoverage] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.materials().then(setMaterials).catch((e: Error) => setLoadError(`Could not load materials: ${e.message}`));
    api.modelInfo()
      .then((m) => setCoverage(m.conformal_coverage_90 ?? null))
      .catch((e: Error) => console.warn('Model info unavailable:', e.message));
  }, []);

  // Feed hero scroll progress into the globe so it tilts away as you leave.
  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: hero.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => { globeProgress.current = self.progress; },
      });
      return () => st.kill();
    },
    { scope: hero },
  );

  const stats = [
    { v: 14000, s: '+', d: 0, label: 'Training rows' },
    coverage != null
      ? { v: coverage * 100, s: '%', d: 1, label: 'Held-out coverage of the 90% interval' }
      : { v: 90, s: '%', d: 0, label: 'Conformal interval target' },
    { v: materials.length || 35, s: '', d: 0, label: 'Materials modelled' },
    { v: 4, s: '', d: 0, label: 'Freight modes' },
  ];

  return (
    <>
      <VerticalDialNav sections={SECTIONS} />

      <section ref={hero} id="intro" className="hero tone-ink">
        <div className="container hero-grid">
          <div className="hero-copy">
            <motion.p className="mono eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              Carbon intelligence for physical products
            </motion.p>
            <SplitHeading as="h1" className="display hero-title" trigger="load" delay={0.5}>
              Every object carries a <em>carbon weight.</em>
            </SplitHeading>
            <motion.p className="lead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}>
              C4Future estimates a product&rsquo;s lifecycle emissions from five inputs — material, mass, origin, freight and end-of-life — and tells you how sure it is.
            </motion.p>
            <motion.div className="cta-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15, duration: 0.8 }}>
              <Button href="#calculate" variant="accent">Calculate a footprint</Button>
              <Button to="/advisor/" variant="line">Ask the advisor</Button>
            </motion.div>
          </div>
          <motion.div className="hero-globe" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
            <AtomicGlobe progress={globeProgress} />
            <span className="hero-globe-caption mono">Drag to spin</span>
          </motion.div>
        </div>
        <motion.div className="hero-meta container mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          <span>XGBoost regressor</span>
          <span>Conformal 90% intervals</span>
          <span>TreeSHAP attributions</span>
          <span>&lt; 100 ms inference</span>
        </motion.div>
      </section>

      <section id="why" className="why">
        <div className="container">
          <p className="mono eyebrow">01 — Why</p>
          <TextRevealOnScroll className="why-text">
            A cotton shirt flown out of Shanghai can emit more <em>in the air</em> than it did in the field. Most of a product&rsquo;s footprint is decided before it exists — by what it is made of, where, and how it travels. C4Future puts a number on those choices, <em>with honest error bars,</em> while they can still change.
          </TextRevealOnScroll>
        </div>
      </section>

      <ScrollZoomReveal id="model" left="The hidden" right="number" media={<Plate kind="contour" seed={14} tone="ink" label="Topographic contour plate" />}>
        <p className="mono eyebrow">02 — The model</p>
        <div className="szr-stats">
          {stats.map((s) => (
            <div key={s.label} className="szr-stat">
              <CountUp className="szr-stat-value" value={s.v} suffix={s.s} decimals={s.d} />
              <span className="mono">{s.label}</span>
            </div>
          ))}
        </div>
      </ScrollZoomReveal>

      <section id="calculate" className="section calc-section">
        <div className="container calc-grid">
          <div className="calc-intro">
            <p className="mono eyebrow">03 — Calculate</p>
            <SplitHeading className="heading">Five inputs. <em>One honest number.</em></SplitHeading>
            <p className="lead">
              Fill in the product sheet. The estimate comes back with a 90% interval, a grade, the features that drove it and what it equals in everyday terms.
            </p>
            <ol className="calc-steps mono">
              <li><span>A</span>Material and mass set the production baseline</li>
              <li><span>B</span>Country sets the grid that powers manufacturing</li>
              <li><span>C</span>Freight mode and distance add transport</li>
              <li><span>D</span>End-of-life adds or credits disposal</li>
            </ol>
          </div>
          <Calculator materials={materials} loadError={loadError} />
        </div>
      </section>

      <ImageScroller
        id="tools"
        items={TOOLS}
        heading={
          <div className="isc-heading">
            <p className="mono eyebrow">04 — Tools</p>
            <SplitHeading className="heading">Three engines, <em>six tools.</em></SplitHeading>
          </div>
        }
      />

      <section id="start" className="section start">
        <div className="container">
          <p className="mono eyebrow">05 — Start</p>
          <SplitHeading className="display start-title">Your product. <em>Its real footprint.</em></SplitHeading>
          <div className="cta-row">
            <Button href="#calculate" variant="accent">Calculate a footprint</Button>
            <Button to="/compare/" variant="line">Compare two products</Button>
          </div>
        </div>
      </section>
    </>
  );
}

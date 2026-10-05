import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { api, COUNTRIES, END_OF_LIFE, TRANSPORT_MODES, type Country, type EndOfLife, type TransportMode } from '../lib/api';
import { saveResult } from '../lib/result';
import { ScrollTrigger, useGSAP } from '../lib/gsap';
import { KineticHeading } from '../components/motion-graphics/KineticHeading';
import { Marquee } from '../components/motion-graphics/Marquee';
import { MorphBlob } from '../components/motion-graphics/MorphBlob';
import { CountUp } from '../components/motion-graphics/CountUp';
import { SupplyChainStory } from '../components/motion-graphics/SupplyChainStory';
import { TiltCard } from '../components/TiltCard';
import { MagneticButton } from '../components/MagneticButton';
import { Reveal, RevealGroup, RevealItem } from '../components/Reveal';

const CarbonGlobe = lazy(() => import('../three/CarbonGlobe'));

const FEATURES = [
  { icon: '⚡', title: 'Instant Estimates', desc: 'Sub-100ms predictions from a locally served XGBoost model — no API latency.' },
  { icon: '📊', title: 'SHAP Explanations', desc: 'Per-prediction TreeSHAP values show exactly which factors drive your carbon number.' },
  { icon: '🔗', title: 'RAG Advisor', desc: 'LangChain + ChromaDB retrieval with streaming answers, grounded in real documents.' },
  { icon: '📦', title: 'BoM Decomposer', desc: 'Describe a product in plain language — the AI splits it into a Bill of Materials and estimates each part.' },
  { icon: '⚖️', title: 'Side-by-Side Compare', desc: 'Pit two products against each other with the real model and see where the difference comes from.' },
  { icon: '🎯', title: 'Uncertainty Bands', desc: 'Conformal prediction gives every estimate a calibrated 90% interval — no overconfident point numbers.' },
];
const TECH = ['XGBoost', 'Conformal Prediction', 'SHAP', 'LangChain', 'ChromaDB', 'Django 5', 'React', 'Three.js', 'GSAP', 'Motion'];

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
  const pct = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100;
  const rangeBg = (p: number) => ({ background: `linear-gradient(90deg, var(--green) ${p}%, rgba(255,255,255,0.08) ${p}%)` });

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
    <TiltCard intensity={6} id="calculator" style={{ padding: '2.25rem' }}>
      <div className="depth-1">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Product details</h2>
          <span className="pill">~100 ms inference</span>
        </div>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="stack" style={{ alignItems: 'center', padding: '4rem 0' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="spinner" />
              <p className="secondary">Analysing environmental impact…</p>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
              <div className="field">
                <label className="label" htmlFor="productName">Product name</label>
                <input id="productName" className="input" placeholder="e.g. Cotton T-Shirt" value={form.product_name} onChange={(e) => set('product_name', e.target.value)} maxLength={200} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="material">Material</label>
                  <select id="material" className="select" required value={form.material} onChange={(e) => set('material', e.target.value)}>
                    <option value="">{materials.length ? 'Select material…' : 'Loading…'}</option>
                    {materials.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label" htmlFor="country">Manufacturing country</label>
                  <select id="country" className="select" value={form.country} onChange={(e) => set('country', e.target.value as Country)}>
                    {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="weight">Product weight <span className="value">{form.weight_kg.toFixed(1)} kg</span></label>
                <input id="weight" type="range" className="range" min={0.1} max={50} step={0.1} value={form.weight_kg} style={rangeBg(pct(form.weight_kg, 0.1, 50))} onChange={(e) => set('weight_kg', parseFloat(e.target.value))} />
              </div>
              <div className="field">
                <span className="label">Transport</span>
                <LayoutGroup id="transport">
                  <div className="segmented" role="group" aria-label="Transport mode">
                    {TRANSPORT_MODES.map((m) => (
                      <button key={m.value} type="button" aria-pressed={form.transport_mode === m.value} onClick={() => set('transport_mode', m.value)}>
                        {form.transport_mode === m.value && <motion.span layoutId="seg" className="seg-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </LayoutGroup>
              </div>
              <div className="form-row">
                <div className="field">
                  <label className="label" htmlFor="distance">Distance <span className="value">{form.transport_distance_km.toLocaleString()} km</span></label>
                  <input id="distance" type="range" className="range" min={50} max={20000} step={50} value={form.transport_distance_km} style={rangeBg(pct(form.transport_distance_km, 50, 20000))} onChange={(e) => set('transport_distance_km', parseFloat(e.target.value))} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="eol">End-of-life</label>
                  <select id="eol" className="select" value={form.eol} onChange={(e) => set('eol', e.target.value as EndOfLife)}>
                    {END_OF_LIFE.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {(loadError || submitError) && <div className="error-box" style={{ marginBottom: '1rem' }}>{loadError || submitError}</div>}
              <MagneticButton type="submit" block disabled={!form.material}>🌱 Calculate carbon footprint</MagneticButton>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </TiltCard>
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

  // Feed hero scroll progress into the 3D globe so it recedes as you scroll.
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

  return (
    <>
      <section ref={hero} className="hero">
        <MorphBlob from="#64ffb4" to="#00d9ff" size={560} style={{ top: '-10%', left: '-12%' }} />
        <MorphBlob from="#8b5cf6" to="#ff6b35" size={460} duration={8} style={{ bottom: '-15%', right: '-8%', opacity: 0.35 }} />
        <div className="container hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <motion.div className="hero-badge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <span className="pulse-dot" /> AI-powered carbon intelligence
            </motion.div>
            <KineticHeading as="h1" className="display" trigger="load" delay={0.5}>
              Calculate the true <span className="gradient-text">carbon cost</span> of any product
            </KineticHeading>
            <motion.p className="lead" style={{ marginTop: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }}>
              A custom-trained XGBoost model with conformal prediction delivers instant, uncertainty-bounded carbon estimates — grounded in real emission data.
            </motion.p>
            <motion.div className="hero-ctas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
              <MagneticButton href="#calculator">🌱 Calculate now</MagneticButton>
              <MagneticButton to="/advisor/" variant="ghost">Ask the AI Advisor →</MagneticButton>
            </motion.div>
          </div>
          <motion.div className="hero-globe" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            <Suspense fallback={null}>
              <CarbonGlobe progress={globeProgress} />
            </Suspense>
          </motion.div>
        </div>
        <div className="scroll-hint" aria-hidden>
          Scroll
          <motion.div className="line" animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
      </section>

      <Marquee items={['Measure', 'Explain', 'Compare', 'Decompose', 'Reduce']} />

      <section className="section-sm">
        <div className="container" style={{ maxWidth: 720 }}>
          <Calculator materials={materials} loadError={loadError} />
        </div>
      </section>

      <section className="section-sm">
        <RevealGroup className="container grid-4">
          {[
            { v: 14000, s: '+', label: 'Training rows', d: 0 },
            coverage != null
              ? { v: coverage * 100, s: '%', label: 'Conformal 90% coverage (held-out)', d: 1 }
              : { v: 90, s: '%', label: 'Conformal interval target', d: 0 },
            { v: materials.length || 35, s: '', label: 'Materials modelled', d: 0 },
            { v: 4, s: '', label: 'Transport modes', d: 0 },
          ].map((s) => (
            <RevealItem key={s.label}>
              <div className="glass stat">
                <CountUp className="stat-value gradient-text" value={s.v} suffix={s.s} decimals={s.d} />
                <div className="stat-label">{s.label}</div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <SupplyChainStory />

      <section className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3.5rem' }}>
            <span className="eyebrow">Capabilities</span>
            <KineticHeading className="heading">
              Everything you need to <span className="gradient-text">measure &amp; reduce</span>
            </KineticHeading>
          </div>
          <RevealGroup className="grid-3">
            {FEATURES.map((f) => (
              <RevealItem key={f.title}>
                <TiltCard style={{ height: '100%' }}>
                  <div className="depth-2 feature-icon">{f.icon}</div>
                  <div className="depth-1">
                    <div className="feature-title">{f.title}</div>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </TiltCard>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <Marquee items={TECH} speed={-1.8} outline />

      <section className="section-sm">
        <Reveal className="container text-center">
          <span className="eyebrow">Start now</span>
          <h2 className="heading">Your product. Its <span className="gradient-text">real footprint</span>.</h2>
          <div className="hero-ctas" style={{ justifyContent: 'center' }}>
            <MagneticButton href="#calculator">Calculate a footprint</MagneticButton>
            <MagneticButton to="/compare/" variant="ghost">Compare two products</MagneticButton>
          </div>
        </Reveal>
      </section>
    </>
  );
}

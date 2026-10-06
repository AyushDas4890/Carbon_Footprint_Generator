import { useMemo, type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BREAKDOWN_PARTS, GRADE_COLORS, loadResult, prettyMaterial } from '../lib/result';
import { COUNTRIES } from '../lib/api';
import { LanyardPass } from '../components/kit/LanyardPass';
import { SplitHeading } from '../components/kit/TextReveal';
import { Mark } from '../components/kit/PillNav';
import { Button } from '../components/ui/Button';
import { CountUp } from '../components/ui/CountUp';
import { PageHead } from '../components/ui/PageHead';
import { DivergingBars, StackBar } from '../components/ui/Charts';

const REDUCE = [
  { title: 'Change the material', body: 'Recycled or bio-based alternatives typically cut material emissions by 30–60%.' },
  { title: 'Change the freight', body: 'Moving the same load from air to sea cuts transport emissions by up to ~95%.' },
  { title: 'Change the grid', body: 'Manufacturing on a low-carbon grid shrinks the energy share of the footprint.' },
  { title: 'Close the loop', body: 'Designing for recycling credits back part of the production emissions at end of life.' },
];

/** Deterministic barcode-ish stripe pattern derived from the product name. */
function Barcode({ text }: { text: string }) {
  const bars = Array.from({ length: 38 }, (_, i) => ((text.charCodeAt(i % Math.max(text.length, 1)) || 7) * (i + 3)) % 4 + 1);
  return (
    <svg className="pass-barcode" viewBox={`0 0 ${bars.reduce((s, b) => s + b + 1.5, 0)} 20`} preserveAspectRatio="none" aria-hidden>
      {bars.reduce<{ x: number; el: ReactElement[] }>((acc, w, i) => {
        acc.el.push(<rect key={i} x={acc.x} y={0} width={w * 0.8} height={20} />);
        acc.x += w + 1.5;
        return acc;
      }, { x: 0, el: [] }).el}
    </svg>
  );
}

export default function Results() {
  const stored = useMemo(loadResult, []);
  if (!stored) return <Navigate to="/" replace />;
  const { request, response: r } = stored;

  const parts = BREAKDOWN_PARTS.map((p) => ({ label: p.label, color: p.color, value: r.breakdown[p.key] }));
  const partsTotal = parts.reduce((s, p) => s + p.value, 0);
  const ci = r.confidence_interval;
  const grade = r.sustainability_rating?.grade ?? '—';
  const country = COUNTRIES.find((c) => c.value === request.country)?.label ?? request.country;
  const explanations = (r.explanations ?? []).filter((e) => !e.feature.startsWith('BASE')).slice(0, 6);
  const equivalents = r.equivalency
    ? [
        { v: r.equivalency.car_km, d: 1, unit: 'km', label: 'driven in an average car' },
        { v: r.equivalency.smartphone_charges, d: 0, unit: '', label: 'smartphone charges' },
        { v: r.equivalency.washing_loads, d: 1, unit: '', label: 'washing-machine loads' },
        ...(r.compensation ? [{ v: r.compensation.trees_display, d: 1, unit: '', label: 'trees growing for a year to absorb it' }] : []),
      ]
    : [];

  return (
    <div className="container page-pad">
      <div className="results-top">
        <div>
          <PageHead
            index="R—01"
            eyebrow="Analysis complete"
            title={<>{request.product_name}</>}
          />
          <div className="result-figure">
            <div className="result-number">
              <CountUp value={r.co2_kg} decimals={2} onView={false} />
              <span className="result-unit">kg CO₂e</span>
            </div>
            <p className="mono result-caption">Estimated lifecycle emissions</p>
            {ci && (
              <div className="ci">
                <div className="ci-scale" aria-hidden>
                  <motion.span
                    className="ci-band"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <motion.span
                    className="ci-point"
                    style={{ left: `${((r.co2_kg - ci.lower) / Math.max(ci.upper - ci.lower, 1e-6)) * 100}%` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.6, type: 'spring', stiffness: 300, damping: 18 }}
                  />
                </div>
                <div className="ci-labels mono">
                  <span>{ci.lower.toFixed(2)}</span>
                  <span>90% interval</span>
                  <span>{ci.upper.toFixed(2)}</span>
                </div>
              </div>
            )}
            <dl className="spec mono">
              <div><dt>Material</dt><dd>{prettyMaterial(request.material)}</dd></div>
              <div><dt>Weight</dt><dd>{request.weight_kg} kg</dd></div>
              <div><dt>Made in</dt><dd>{country}</dd></div>
              <div><dt>Freight</dt><dd>{request.transport_mode.toLowerCase()} · {request.transport_distance_km.toLocaleString()} km</dd></div>
              <div><dt>End of life</dt><dd>{request.eol.toLowerCase()}</dd></div>
            </dl>
          </div>
        </div>

        <LanyardPass width={270} height={390} strapLength={200} strapText={`${grade} · ${request.product_name.toUpperCase()} · `}>
          <div className="pass">
            <div className="pass-head">
              <span className="row-inline"><Mark size={18} /> C4Future</span>
              <span className="mono">Carbon pass</span>
            </div>
            <div className="pass-grade" style={{ background: GRADE_COLORS[grade] ?? 'var(--ink)' }}>
              <span className="pass-grade-letter">{grade}</span>
              <span className="mono pass-grade-label">{r.sustainability_rating?.label ?? 'Unrated'}</span>
            </div>
            <div className="pass-name">{request.product_name}</div>
            <dl className="pass-rows mono">
              <div><dt>CO₂e</dt><dd>{r.co2_kg.toFixed(2)} kg</dd></div>
              {r.sustainability_rating && <div><dt>Intensity</dt><dd>{r.sustainability_rating.intensity_kg_co2_per_kg.toFixed(2)} /kg</dd></div>}
              {ci && <div><dt>90% CI</dt><dd>{ci.lower.toFixed(1)}–{ci.upper.toFixed(1)}</dd></div>}
            </dl>
            <Barcode text={request.product_name + request.material} />
            <div className="pass-foot mono">Drag me</div>
          </div>
        </LanyardPass>
      </div>

      <section className="results-section">
        <div className="section-label mono"><span>02</span>Where it comes from</div>
        <div className="results-grid">
          <div>
            <SplitHeading as="h2" className="heading-sm">Breakdown by <em>lifecycle stage</em></SplitHeading>
            <p className="muted small">Factor-based split ({partsTotal.toFixed(2)} kg). The headline number is the model&rsquo;s estimate, so the two can differ.</p>
          </div>
          <StackBar parts={parts} unit="kg" />
        </div>
      </section>

      <section className="results-section">
        <div className="section-label mono"><span>03</span>What drives it</div>
        <div className="results-grid">
          <div>
            <SplitHeading as="h2" className="heading-sm">Feature <em>contributions</em></SplitHeading>
            <p className="muted small">
              TreeSHAP, in kg CO₂e. <span className="key key-up" /> pushes the estimate up, <span className="key key-down" /> pulls it down.
            </p>
          </div>
          {explanations.length ? (
            <DivergingBars rows={explanations.map((e) => ({ label: e.feature, value: e.contribution_kg_co2 }))} unit="kg CO₂e" />
          ) : (
            <p className="muted">SHAP explanations are not available for this prediction.</p>
          )}
        </div>
      </section>

      {equivalents.length > 0 && (
        <section className="results-section">
          <div className="section-label mono"><span>04</span>In everyday terms</div>
          <div className="equiv-grid">
            {equivalents.map((q) => (
              <div key={q.label} className="equiv">
                <CountUp className="equiv-value" value={q.v} decimals={q.d} suffix={q.unit ? ` ${q.unit}` : ''} />
                <span className="mono">{q.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="results-section">
        <div className="section-label mono"><span>05</span>How to reduce it</div>
        <ol className="reduce-list">
          {REDUCE.map((o, i) => (
            <motion.li
              key={o.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              <h3>{o.title}</h3>
              <p>{o.body}</p>
            </motion.li>
          ))}
        </ol>
        {r.compensation?.message && <p className="muted small" style={{ marginTop: '1.5rem' }}>{r.compensation.message}</p>}
      </section>

      <div className="cta-row" style={{ marginTop: '4rem' }}>
        <Button to="/advisor/" variant="accent">Ask how to cut it</Button>
        <Button to="/insights/" variant="line">See benchmarks</Button>
        <Button to="/" variant="line">New calculation</Button>
      </div>
    </div>
  );
}

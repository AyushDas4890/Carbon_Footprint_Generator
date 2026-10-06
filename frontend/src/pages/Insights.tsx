import { useEffect, useMemo, useState } from 'react';
import { api, type ModelInfo } from '../lib/api';
import { BREAKDOWN_PARTS, loadResult, prettyMaterial, type StoredResult } from '../lib/result';
import { SplitHeading } from '../components/kit/TextReveal';
import { Plate } from '../components/Plate';
import { Button } from '../components/ui/Button';
import { CountUp } from '../components/ui/CountUp';
import { PageHead } from '../components/ui/PageHead';
import { BarList } from '../components/ui/Charts';

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
      <PageHead
        index="I—01"
        eyebrow="Insights"
        title={<>Benchmarks &amp; <em>uncertainty</em></>}
        lead="Your latest prediction set against reference materials and freight modes, with the interval the model puts around it."
      />

      {model && (
        <dl className="kpis">
          <div><dt className="mono">Model</dt><dd className="kpi-text">{model.model_family}</dd></div>
          <div><dt className="mono">R² held-out</dt><dd><CountUp value={model.r2_score} decimals={3} onView={false} /></dd></div>
          <div><dt className="mono">MAE</dt><dd><CountUp value={model.mae} decimals={2} suffix=" kg" onView={false} /></dd></div>
          <div><dt className="mono">90% coverage</dt><dd>{model.conformal_coverage_90 != null ? <CountUp value={model.conformal_coverage_90 * 100} decimals={1} suffix="%" onView={false} /> : '—'}</dd></div>
        </dl>
      )}
      {modelError && <div className="error-box" role="alert">Model info unavailable: {modelError}</div>}

      {stored ? <Dashboard stored={stored} /> : (
        <div className="empty">
          <div className="empty-art"><Plate kind="bars" seed={4} /></div>
          <div>
            <h2 className="heading-sm">No prediction <em>yet.</em></h2>
            <p className="muted">Run the calculator once and your benchmarks and interval appear here.</p>
            <div className="cta-row">
              <Button to="/" variant="accent">Start a prediction</Button>
              <Button to="/compare/" variant="line">Compare products</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ stored }: { stored: StoredResult }) {
  const { request, response: r } = stored;
  const ci = r.confidence_interval;
  const material = prettyMaterial(request.material);
  const benchHasMaterial = Object.keys(MATERIAL_BENCH).some((m) => m.toLowerCase() === material.toLowerCase());
  const transportLabel = request.transport_mode.charAt(0) + request.transport_mode.slice(1).toLowerCase();

  return (
    <>
      <section className="results-section">
        <div className="section-label mono"><span>01</span>{request.product_name}</div>
        <div className="kpis kpis-big">
          <div><dt className="mono">Footprint</dt><dd><CountUp value={r.co2_kg} decimals={2} suffix=" kg" /></dd></div>
          <div><dt className="mono">Material share</dt><dd><CountUp value={r.breakdown.materials_percent} suffix="%" /></dd></div>
          <div><dt className="mono">Transport share</dt><dd><CountUp value={r.breakdown.transport_percent} suffix="%" /></dd></div>
          <div><dt className="mono">Interval width</dt><dd>{ci ? <CountUp value={ci.upper - ci.lower} decimals={2} suffix=" kg" /> : '—'}</dd></div>
        </div>
      </section>

      <section className="results-section">
        <div className="section-label mono"><span>02</span>Breakdown</div>
        <div className="results-grid">
          <SplitHeading as="h2" className="heading-sm">Emissions by <em>stage</em></SplitHeading>
          <BarList unit="kg CO₂e" rows={BREAKDOWN_PARTS.map((p) => ({ label: p.label, value: r.breakdown[p.key], color: p.color }))} />
        </div>
      </section>

      <section className="results-section">
        <div className="section-label mono"><span>03</span>Material benchmark</div>
        <div className="results-grid">
          <div>
            <SplitHeading as="h2" className="heading-sm">Production intensity, <em>kg CO₂e per kg</em></SplitHeading>
            <p className="muted small">
              {benchHasMaterial ? <>Your material is marked in <span className="accent-text">ember</span>.</> : <>{material} is not in this reference set.</>}
            </p>
          </div>
          <BarList
            unit="kg CO₂e/kg"
            rows={Object.entries(MATERIAL_BENCH)
              .sort((a, b) => b[1] - a[1])
              .map(([m, v]) => {
                const mine = m.toLowerCase() === material.toLowerCase();
                return { label: m, value: v, color: mine ? 'var(--accent)' : 'var(--ink)', highlight: mine, note: mine ? 'yours' : undefined };
              })}
          />
        </div>
      </section>

      <section className="results-section">
        <div className="section-label mono"><span>04</span>Freight benchmark</div>
        <div className="results-grid">
          <SplitHeading as="h2" className="heading-sm">Transport, <em>kg CO₂e per kg per 1,000 km</em></SplitHeading>
          <BarList
            unit="kg CO₂e"
            decimals={3}
            rows={Object.entries(TRANSPORT_BENCH).map(([m, v]) => {
              const mine = m === transportLabel;
              return { label: m, value: v, color: mine ? 'var(--accent)' : 'var(--ink)', highlight: mine, note: mine ? 'yours' : undefined };
            })}
          />
        </div>
      </section>

      <section className="results-section">
        <div className="section-label mono"><span>05</span>Uncertainty</div>
        <div className="results-grid">
          <div>
            <SplitHeading as="h2" className="heading-sm">Conformal <em>90% interval</em></SplitHeading>
            <p className="muted small">On held-out products, the true value lands inside this band about nine times in ten.</p>
          </div>
          {ci ? (
            <BarList
              unit="kg CO₂e"
              max={ci.upper}
              rows={[
                { label: 'Lower bound', value: ci.lower, color: 'var(--ink-40)' },
                { label: 'Point estimate', value: r.co2_kg, color: 'var(--accent)', highlight: true },
                { label: 'Upper bound', value: ci.upper, color: 'var(--ink-40)' },
              ]}
            />
          ) : (
            <p className="muted">This prediction has no interval.</p>
          )}
        </div>
      </section>
    </>
  );
}

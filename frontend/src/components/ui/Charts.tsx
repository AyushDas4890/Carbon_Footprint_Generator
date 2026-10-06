import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

const EASE = [0.16, 1, 0.3, 1] as const;
const fmt = (v: number, d: number) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

function Tip({ children }: { children: ReactNode }) {
  return (
    <motion.div className="chart-tip mono" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} role="status">
      {children}
    </motion.div>
  );
}

export interface BarRow { label: string; value: number; color?: string; highlight?: boolean; note?: string }

/**
 * Horizontal bars with the label and value printed on every row (the chart
 * doubles as its own table). Hovering a row shows exact value and share.
 */
export function BarList({ rows, unit, decimals = 2, max }: { rows: BarRow[]; unit: string; decimals?: number; max?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = max ?? Math.max(...rows.map((r) => r.value), 1e-6);
  const total = rows.reduce((s, r) => s + Math.max(r.value, 0), 0);
  return (
    <div className="bars" onPointerLeave={() => setHover(null)}>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`bars-row${r.highlight ? ' is-highlight' : ''}${hover === i ? ' is-hover' : ''}`}
          onPointerEnter={() => setHover(i)}
        >
          <span className="bars-label">{r.label}{r.note && <em className="bars-note mono">{r.note}</em>}</span>
          <span className="bars-track">
            <motion.span
              className="bars-fill"
              style={{ background: r.color ?? 'var(--ink)', originX: 0 }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: Math.max(0, r.value) / top }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.1 + i * 0.07, ease: EASE }}
            />
          </span>
          <span className="bars-value mono">{fmt(r.value, decimals)}</span>
          {hover === i && (
            <Tip>{r.label}: {fmt(r.value, decimals)} {unit}{total > 0 && rows.length > 1 ? ` · ${fmt((Math.max(r.value, 0) / total) * 100, 1)}% of total` : ''}</Tip>
          )}
        </div>
      ))}
    </div>
  );
}

export interface DivergingRow { label: string; value: number }

/** Bars that grow left (pull down) or right (push up) from a neutral zero line. */
export function DivergingBars({ rows, unit, decimals = 2 }: { rows: DivergingRow[]; unit: string; decimals?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = Math.max(...rows.map((r) => Math.abs(r.value)), 1e-6);
  return (
    <div className="bars bars-div" onPointerLeave={() => setHover(null)}>
      {rows.map((r, i) => {
        const up = r.value >= 0;
        const w = (Math.abs(r.value) / top) * 50;
        return (
          <div key={r.label} className={`bars-row${hover === i ? ' is-hover' : ''}`} onPointerEnter={() => setHover(i)}>
            <span className="bars-label">{r.label}</span>
            <span className="bars-track">
              <span className="bars-zero" aria-hidden />
              <motion.span
                className={`bars-fill ${up ? 'is-up' : 'is-down'}`}
                style={{ left: up ? '50%' : `${50 - w}%`, width: `${w}%`, originX: up ? 0 : 1, background: up ? 'var(--series-1)' : 'var(--series-2)' }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.07, ease: EASE }}
              />
            </span>
            <span className="bars-value mono">{up ? '+' : '−'}{fmt(Math.abs(r.value), decimals)}</span>
            {hover === i && <Tip>{r.label} {up ? 'adds' : 'removes'} {fmt(Math.abs(r.value), decimals)} {unit}</Tip>}
          </div>
        );
      })}
    </div>
  );
}

export interface GroupSeries { name: string; color: string; values: number[] }

/** Two (or more) series per category, legend above, values printed beside each bar. */
export function GroupedBars({ categories, series, unit, decimals = 2 }: { categories: string[]; series: GroupSeries[]; unit: string; decimals?: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const top = Math.max(...series.flatMap((s) => s.values), 1e-6);
  return (
    <div>
      <div className="legend mono">
        {series.map((s) => (
          <span key={s.name} className="legend-item"><span className="legend-swatch" style={{ background: s.color }} />{s.name}</span>
        ))}
      </div>
      <div className="bars bars-grouped" onPointerLeave={() => setHover(null)}>
        {categories.map((cat, ci) => (
          <div key={cat} className="bars-group">
            <span className="bars-group-label">{cat}</span>
            {series.map((s, si) => {
              const key = `${ci}-${si}`;
              return (
                <div key={s.name} className={`bars-row${hover === key ? ' is-hover' : ''}`} onPointerEnter={() => setHover(key)}>
                  <span className="bars-label bars-label-sm">{s.name}</span>
                  <span className="bars-track">
                    <motion.span
                      className="bars-fill"
                      style={{ background: s.color, originX: 0 }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: s.values[ci] / top }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: ci * 0.1 + si * 0.05, ease: EASE }}
                    />
                  </span>
                  <span className="bars-value mono">{fmt(s.values[ci], decimals)}</span>
                  {hover === key && <Tip>{s.name} · {cat}: {fmt(s.values[ci], decimals)} {unit}</Tip>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** One horizontal bar split into parts with 2px gaps, labelled underneath. */
export function StackBar({ parts, unit, decimals = 2 }: { parts: { label: string; value: number; color: string }[]; unit: string; decimals?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = parts.reduce((s, p) => s + Math.max(p.value, 0), 0) || 1;
  return (
    <div className="stackbar" onPointerLeave={() => setHover(null)}>
      <div className="stackbar-track">
        {parts.map((p, i) => (
          <motion.span
            key={p.label}
            className={`stackbar-seg${hover === i ? ' is-hover' : ''}`}
            style={{ background: p.color, flexGrow: Math.max(p.value, 0) / total }}
            initial={{ opacity: 0, scaleY: 0.2 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
            onPointerEnter={() => setHover(i)}
          />
        ))}
      </div>
      <ul className="stackbar-legend">
        {parts.map((p, i) => (
          <li key={p.label} className={hover === i ? 'is-hover' : ''} onPointerEnter={() => setHover(i)}>
            <span className="legend-swatch" style={{ background: p.color }} />
            <span>{p.label}</span>
            <span className="mono">{fmt(p.value, decimals)} {unit} · {fmt((Math.max(p.value, 0) / total) * 100, 0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

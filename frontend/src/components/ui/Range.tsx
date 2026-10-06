interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

/** Labelled range input; the filled part of the track is a CSS variable. */
export function Range({ id, label, value, min, max, step, format, onChange }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        <span>{label}</span>
        <span className="label-value mono">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

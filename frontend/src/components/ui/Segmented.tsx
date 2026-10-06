import { LayoutGroup, motion } from 'motion/react';

interface Props<T extends string> {
  id: string;
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/** Radio-style segmented control with a sliding shared-layout thumb. */
export function Segmented<T extends string>({ id, label, value, options, onChange }: Props<T>) {
  return (
    <LayoutGroup id={id}>
      <div className="segmented" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
            {value === o.value && <motion.span layoutId="thumb" className="seg-thumb" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

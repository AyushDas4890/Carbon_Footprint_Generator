import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { SplitHeading } from '../kit/TextReveal';

interface Props {
  index: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
}

/** Shared page header: index + eyebrow rule, a serif title rising out of its mask, and a lead. */
export function PageHead({ index, eyebrow, title, lead, aside }: Props) {
  return (
    <header className="page-head">
      <motion.div className="page-head-rule mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <span>{index}</span>
        <motion.span className="rule-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.55, duration: 1.1, ease: [0.16, 1, 0.3, 1] }} />
        <span>{eyebrow}</span>
      </motion.div>
      <div className="page-head-grid">
        <SplitHeading as="h1" className="display" trigger="load" delay={0.55}>{title}</SplitHeading>
        {(lead || aside) && (
          <motion.div className="page-head-side" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }}>
            {lead && <p className="lead">{lead}</p>}
            {aside}
          </motion.div>
        )}
      </div>
    </header>
  );
}

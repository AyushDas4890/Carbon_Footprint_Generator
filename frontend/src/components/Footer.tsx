import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mark, TOOLS } from './kit/PillNav';

export function Footer() {
  return (
    <footer className="footer tone-ink">
      <div className="container">
        <div className="footer-top">
          <p className="footer-pitch">
            Know the weight of what you make <em>before</em> you make it.
          </p>
          <div className="footer-cols">
            <div>
              <h4 className="mono">Tools</h4>
              <ul>
                <li><Link to="/">Calculator</Link></li>
                {TOOLS.map((t) => <li key={t.to}><Link to={t.to}>{t.label}</Link></li>)}
                <li><Link to="/advisor/">Advisor</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mono">Under the hood</h4>
              <ul className="footer-plain">
                <li>XGBoost regressor</li>
                <li>Conformal intervals</li>
                <li>TreeSHAP attributions</li>
                <li>RAG over LCA sources</li>
              </ul>
            </div>
          </div>
        </div>
        <motion.div
          className="footer-word"
          initial={{ y: '40%', opacity: 0 }}
          whileInView={{ y: '0%', opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        >
          C4Future
        </motion.div>
        <div className="footer-bottom mono">
          <span className="row-inline"><Mark size={16} /> © {new Date().getFullYear()} C4Future</span>
          <span>Estimates, not audits — every number ships with its interval</span>
        </div>
      </div>
    </footer>
  );
}

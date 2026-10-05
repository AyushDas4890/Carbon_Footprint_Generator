import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from './Navbar';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: '0.9rem' }}>
              <Logo />
              <span><span className="c4">C4</span>Future</span>
            </div>
            <p className="secondary" style={{ maxWidth: 340, fontSize: '0.9rem' }}>
              AI-powered carbon intelligence — helping you understand and reduce the environmental impact of every product.
            </p>
          </div>
          <div>
            <h4>Tools</h4>
            <ul>
              <li><Link to="/">Calculator</Link></li>
              <li><Link to="/results/">Results</Link></li>
              <li><Link to="/compare/">Compare</Link></li>
              <li><Link to="/decompose/">Decompose</Link></li>
            </ul>
          </div>
          <div>
            <h4>Insights</h4>
            <ul>
              <li><Link to="/insights/">Dashboard</Link></li>
              <li><Link to="/advisor/">AI Advisor</Link></li>
            </ul>
          </div>
          <div>
            <h4>Model</h4>
            <ul>
              <li>XGBoost ML</li>
              <li>SHAP Analysis</li>
              <li>RAG Pipeline</li>
            </ul>
          </div>
        </div>
        <motion.div
          className="footer-word"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden
        >
          C4FUTURE
        </motion.div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} <span style={{ color: 'var(--green)' }}>C4Future</span> — Carbon Intelligence</p>
          <p>Built with <span style={{ color: 'var(--green)' }}>♦</span> for a sustainable future</p>
        </div>
      </div>
    </footer>
  );
}

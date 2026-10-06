import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';

const SPRING = { type: 'spring', stiffness: 420, damping: 34 } as const;

const PRIMARY = [
  { to: '/', label: 'Calculate' },
  { to: '/results/', label: 'Results' },
];

export const TOOLS = [
  { to: '/compare/', label: 'Compare', note: 'Two products, one verdict' },
  { to: '/decompose/', label: 'Decompose', note: 'Plain words to a bill of materials' },
  { to: '/insights/', label: 'Insights', note: 'Benchmarks and uncertainty' },
];

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="mark">
      <circle cx="20" cy="20" r="4.5" fill="var(--accent)" />
      <ellipse cx="20" cy="20" rx="16" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="20" cy="20" rx="16" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(60 20 20)" />
      <ellipse cx="20" cy="20" rx="16" ry="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-60 20 20)" />
    </svg>
  );
}

/**
 * Floating pill nav. "Tools" opens a dropdown that grows out of the pill
 * (hover on desktop, click/keyboard anywhere); the active route carries a
 * shared-layout highlight. On small screens the pill itself expands into a menu.
 */
export function PillNav() {
  const { pathname } = useLocation();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const root = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const dropdownId = useId();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 240 && !toolsOpen && !menuOpen);
  });

  useEffect(() => {
    setToolsOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!toolsOpen && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setToolsOpen(false); setMenuOpen(false); }
    };
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) { setToolsOpen(false); setMenuOpen(false); }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [toolsOpen, menuOpen]);

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const toolActive = TOOLS.some((t) => isActive(t.to));
  const hoverOpenedAt = useRef(0);
  const openTools = () => {
    window.clearTimeout(closeTimer.current);
    if (!toolsOpen) hoverOpenedAt.current = performance.now();
    setToolsOpen(true);
  };
  // A click right after hover-open would otherwise toggle the menu straight back shut.
  const toggleTools = () => {
    if (performance.now() - hoverOpenedAt.current < 500) return;
    setToolsOpen((o) => !o);
  };
  const closeToolsSoon = () => { closeTimer.current = window.setTimeout(() => setToolsOpen(false), 140); };

  return (
    <motion.header
      ref={root}
      className="pnav-wrap"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -130 : 0, opacity: 1 }}
      transition={{ ...SPRING, delay: hidden ? 0 : 0.1 }}
    >
      <motion.nav layout className={`pnav${menuOpen ? ' is-open' : ''}`} transition={SPRING} aria-label="Primary">
        <motion.div layout="position" className="pnav-bar">
          <Link to="/" className="pnav-brand" aria-label="C4Future home">
            <Mark />
            <span>C4Future</span>
          </Link>

          <ul className="pnav-links">
            {PRIMARY.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className="pnav-link">
                  {isActive(item.to) && <motion.span layoutId="pnav-active" className="pnav-active" transition={SPRING} />}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
            <li onMouseEnter={openTools} onMouseLeave={closeToolsSoon} className="pnav-tools">
              <button
                type="button"
                className="pnav-link"
                aria-expanded={toolsOpen}
                aria-controls={dropdownId}
                onClick={toggleTools}
              >
                {toolActive && <motion.span layoutId="pnav-active" className="pnav-active" transition={SPRING} />}
                <span>Tools</span>
                <motion.svg width="10" height="10" viewBox="0 0 10 10" animate={{ rotate: toolsOpen ? 180 : 0 }} transition={SPRING} aria-hidden>
                  <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </motion.svg>
              </button>
              <AnimatePresence>
                {toolsOpen && (
                  <motion.div
                    id={dropdownId}
                    className="pnav-drop"
                    initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, scale: 0.97, filter: 'blur(4px)' }}
                    transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    {TOOLS.map((t, i) => (
                      <motion.div key={t.to} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i + 0.05 }}>
                        <NavLink to={t.to} className="pnav-drop-item">
                          <span className="pnav-drop-label">{t.label}</span>
                          <span className="pnav-drop-note">{t.note}</span>
                        </NavLink>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          </ul>

          <NavLink to="/advisor/" className="pnav-cta">Ask the advisor</NavLink>

          <button type="button" className="pnav-burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
            <motion.span animate={menuOpen ? { rotate: 45, y: 3 } : { rotate: 0, y: 0 }} transition={SPRING} />
            <motion.span animate={menuOpen ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }} transition={SPRING} />
          </button>
        </motion.div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.ul
              className="pnav-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.08 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              {[...PRIMARY, ...TOOLS, { to: '/advisor/', label: 'Advisor' }].map((item) => (
                <motion.li key={item.to} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} initial="hidden" animate="show">
                  <NavLink to={item.to} end={item.to === '/'} className="pnav-mobile-link">{item.label}</NavLink>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.nav>
    </motion.header>
  );
}

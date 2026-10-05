import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/results/', label: 'Results' },
  { to: '/insights/', label: 'Insights' },
  { to: '/compare/', label: 'Compare' },
  { to: '/decompose/', label: 'Decompose' },
];

export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden>
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} style={{ originX: '20px', originY: '20px' }}>
        <circle cx="20" cy="20" r="17" stroke="url(#ng)" strokeWidth="1.5" />
        <circle cx="37" cy="20" r="2.5" fill="#64ffb4" />
        <circle cx="20" cy="3" r="2" fill="#00d9ff" />
        <circle cx="3" cy="20" r="2.5" fill="#8b5cf6" />
      </motion.g>
      <circle cx="20" cy="20" r="10" stroke="url(#ng)" strokeWidth="1" opacity="0.6" />
      <circle cx="20" cy="20" r="4" fill="url(#ng)" />
      <defs>
        <linearGradient id="ng" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64ffb4" />
          <stop offset="50%" stopColor="#00d9ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Floating pill nav: hides on scroll-down, returns on scroll-up; active link has a shared-layout pill. */
export function Navbar() {
  const { pathname } = useLocation();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 160 && !open);
  });
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -110 : 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      <NavLink to="/" className="brand" aria-label="C4Future home">
        <Logo />
        <span><span className="c4">C4</span>Future</span>
      </NavLink>
      <button className="nav-toggle" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span /><span /><span />
      </button>
      <ul className={`nav-links${open ? ' open' : ''}`}>
        {NAV.map((item) => (
          <li key={item.to} style={{ position: 'relative' }}>
            <NavLink to={item.to} className={isActive(item.to) ? 'active' : ''} end={item.to === '/'}>
              {isActive(item.to) && (
                <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
              )}
              {item.label}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink to="/advisor/" className={`cta${isActive('/advisor/') ? ' active' : ''}`}>✦ Advisor</NavLink>
        </li>
      </ul>
    </motion.nav>
  );
}

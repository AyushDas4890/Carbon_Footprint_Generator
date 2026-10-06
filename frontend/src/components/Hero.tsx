import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'motion/react';
import { Mark, TOOLS } from './kit/PillNav';
import { prefersReducedMotion } from '../lib/gsap';
import { scrollToHash } from '../lib/useSmoothScroll';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260928_144832_2b6b23aa-4416-4fcb-9df4-132349c59edc.mp4';

const LINKS = [
  { to: '#calculate', label: 'Calculate' },
  { to: '/results/', label: 'Results' },
  ...TOOLS,
  { to: '/advisor/', label: 'Advisor' },
];

const EASE = [0.16, 1, 0.3, 1] as const;
const stack: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } };

/**
 * Engraved-illustration hero: compass, wordmark, tagline and nav stacked at the
 * top; a pen-and-ink viaduct video fills the rest of the viewport and is
 * multiplied into the paper so its white background disappears.
 */
export function Hero({ id }: { id?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion()) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }
    // Only decode while the hero is on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch((err: Error) => console.warn('Hero video did not start:', err.message));
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <section id={id} className="hero">
      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src={VIDEO_SRC} type="video/mp4" />
      </video>

      <motion.div className="hero-content" variants={stack} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
        <motion.div variants={item}>
          <Mark size={56} className="hero-mark" label="C4Future compass" />
        </motion.div>
        <motion.h1 variants={item} className="hero-brand">c4future</motion.h1>
        <motion.p variants={item} className="hero-tagline">
          Estimate, explain and compare a product&rsquo;s lifecycle emissions before you make it.
        </motion.p>
        <motion.nav variants={item} className="hero-nav" aria-label="Tools">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}>
                {link.to.startsWith('#') ? (
                  <a href={link.to} onClick={scrollToHash}>{link.label}</a>
                ) : (
                  <Link to={link.to}>{link.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </motion.nav>
        <motion.p variants={item} className="hero-meta">
          XGBoost regressor · Conformal 90% intervals · TreeSHAP attributions · under 100 ms
        </motion.p>
      </motion.div>
    </section>
  );
}

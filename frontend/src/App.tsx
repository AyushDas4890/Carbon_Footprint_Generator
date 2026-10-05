import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Cursor } from './components/Cursor';
import { PageTransition } from './components/PageTransition';
import { MagneticButton } from './components/MagneticButton';
import { useSmoothScroll } from './lib/useSmoothScroll';
import { ScrollTrigger } from './lib/gsap';
import Home from './pages/Home';

const ParticleField = lazy(() => import('./three/ParticleField'));
const Results = lazy(() => import('./pages/Results'));
const Insights = lazy(() => import('./pages/Insights'));
const Compare = lazy(() => import('./pages/Compare'));
const Decompose = lazy(() => import('./pages/Decompose'));
const Advisor = lazy(() => import('./pages/Advisor'));

function NotFound() {
  return (
    <div className="container page-pad text-center" style={{ paddingTop: '12rem' }}>
      <div className="display gradient-text">404</div>
      <p className="lead" style={{ margin: '1rem auto 2rem' }}>This page drifted off into the atmosphere.</p>
      <MagneticButton to="/">Back home</MagneticButton>
    </div>
  );
}

const ROUTES = [
  { path: '/', title: 'C4Future', element: <Home /> },
  { path: '/results/', title: 'Results', element: <Results /> },
  { path: '/insights/', title: 'Insights', element: <Insights /> },
  { path: '/compare/', title: 'Compare', element: <Compare /> },
  { path: '/decompose/', title: 'Decompose', element: <Decompose /> },
  { path: '/advisor/', title: 'Advisor', element: <Advisor /> },
];

export default function App() {
  const location = useLocation();
  useSmoothScroll();

  useEffect(() => {
    const route = ROUTES.find((r) => r.path === location.pathname);
    document.title = route && route.path !== '/' ? `${route.title} — C4Future` : 'C4Future — Carbon Intelligence';
  }, [location.pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>
      <div className="noise" aria-hidden />
      <Cursor />
      <Navbar />
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          window.scrollTo(0, 0);
          // New page's pinned sections need fresh measurements after the swap.
          requestAnimationFrame(() => ScrollTrigger.refresh());
        }}
      >
        <Routes location={location} key={location.pathname}>
          {ROUTES.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <PageTransition title={r.title}>
                  <Suspense fallback={<div className="page-pad" />}>{r.element}</Suspense>
                </PageTransition>
              }
            />
          ))}
          <Route path="*" element={<PageTransition title="404"><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </MotionConfig>
  );
}

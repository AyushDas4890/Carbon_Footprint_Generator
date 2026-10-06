import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { PillNav } from './components/kit/PillNav';
import { Footer } from './components/Footer';
import { PageTransition } from './components/PageTransition';
import { Button } from './components/ui/Button';
import { useSmoothScroll } from './lib/useSmoothScroll';
import { ScrollTrigger } from './lib/gsap';
import Home from './pages/Home';

const Results = lazy(() => import('./pages/Results'));
const Insights = lazy(() => import('./pages/Insights'));
const Compare = lazy(() => import('./pages/Compare'));
const Decompose = lazy(() => import('./pages/Decompose'));
const Advisor = lazy(() => import('./pages/Advisor'));

function NotFound() {
  return (
    <div className="container page-pad">
      <p className="mono eyebrow">404 — Off the map</p>
      <h1 className="display" style={{ margin: '1.5rem 0 2.5rem' }}>This page drifted<br /><em>into the atmosphere.</em></h1>
      <Button to="/">Back to the calculator</Button>
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
      <PillNav />
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

import { useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max rotation in degrees at the card's edge. */
  intensity?: number;
  id?: string;
}

/** Glass card that tilts toward the pointer in 3D, with a moving specular glare. */
export function TiltCard({ children, className = '', style, intensity = 10, id }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), spring);
  const glareX = useTransform(px, (v) => `${v * 100}%`);
  const glareY = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.22), transparent 55%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      id={id}
      className={`glass tilt ${className}`}
      style={{ ...style, rotateX, rotateY, transformPerspective: 1100 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      {!reduce && <motion.div className="tilt-glare" style={{ background: glare }} />}
    </motion.div>
  );
}

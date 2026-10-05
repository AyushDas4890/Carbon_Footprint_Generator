import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

interface Props {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  to?: string;
  href?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  block?: boolean;
}

const MotionLink = motion.create(Link);

/** Pill button that is pulled toward the cursor and springs back on leave. */
export function MagneticButton({ children, variant = 'primary', to, href, type = 'button', onClick, disabled, block }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15 });

  const onMove = (e: React.PointerEvent) => {
    if (reduce || disabled || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.4);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const className = `btn btn-${variant}${block ? ' btn-block' : ''}`;
  const common = {
    className,
    style: { x, y },
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    whileTap: { scale: 0.96 },
  };
  const content = (
    <>
      <span className="shine" />
      {children}
    </>
  );

  if (to) {
    return (
      <MotionLink ref={ref as React.Ref<HTMLAnchorElement>} to={to} {...common}>
        {content}
      </MotionLink>
    );
  }
  if (href) {
    return (
      <motion.a ref={ref as React.Ref<HTMLAnchorElement>} href={href} {...common}>
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button ref={ref as React.Ref<HTMLButtonElement>} type={type} onClick={onClick} disabled={disabled} {...common}>
      {content}
    </motion.button>
  );
}

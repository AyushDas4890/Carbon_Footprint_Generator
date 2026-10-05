import { useRef, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface Props {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
  /** 'load' plays immediately (hero); 'scroll' plays when the heading enters view. */
  trigger?: 'load' | 'scroll';
  delay?: number;
}

/** Kinetic typography: characters flip up out of a 3D mask one after another. */
export function KineticHeading({ children, as: Tag = 'h2', className = '', trigger = 'scroll', delay = 0 }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const split = SplitText.create(ref.current, { type: 'words,chars', mask: 'words', wordsClass: 'word', charsClass: 'char' });
      gsap.from(split.chars, {
        yPercent: 115,
        rotationX: -85,
        opacity: 0,
        transformOrigin: '50% 100% -20px',
        duration: 1,
        ease: 'expo.out',
        stagger: 0.022,
        delay,
        scrollTrigger: trigger === 'scroll' ? { trigger: ref.current, start: 'top 85%', once: true } : undefined,
      });
      return () => split.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={`split-3d ${className}`}>
      {children}
    </Tag>
  );
}

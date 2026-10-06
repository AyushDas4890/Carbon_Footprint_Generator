import { useRef, type ReactNode } from 'react';
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '../../lib/gsap';

interface ScrollProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'h2' | 'div';
}

/**
 * Paragraph whose words light up one by one as it scrolls through the
 * viewport (scrubbed, so scrolling back dims them again). `<em>` children keep
 * their own colour and pick up the accent once lit.
 */
export function TextRevealOnScroll({ children, className = '', as: Tag = 'p' }: ScrollProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const split = SplitText.create(ref.current, { type: 'words', wordsClass: 'tr-word' });
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: ref.current, start: 'top 82%', end: 'bottom 45%', scrub: true },
        },
      );
      return () => split.revert();
    },
    { scope: ref },
  );

  return <Tag ref={ref} className={`text-reveal ${className}`}>{children}</Tag>;
}

interface HeadingProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  /** 'load' plays on mount (page heads); 'scroll' when the heading enters view. */
  trigger?: 'load' | 'scroll';
  delay?: number;
}

/** Lines rise out of a mask, one after another. */
export function SplitHeading({ children, as: Tag = 'h2', className = '', trigger = 'scroll', delay = 0 }: HeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      const split = SplitText.create(ref.current, { type: 'lines', mask: 'lines', linesClass: 'sh-line', autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          delay,
          scrollTrigger: trigger === 'scroll' ? { trigger: ref.current, start: 'top 88%', once: true } : undefined,
        }),
      });
      return () => split.revert();
    },
    { scope: ref },
  );

  return <Tag ref={ref} className={className}>{children}</Tag>;
}

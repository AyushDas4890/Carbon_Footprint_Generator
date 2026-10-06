import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { scrollToHash } from '../../lib/useSmoothScroll';

interface Props {
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'solid' | 'line' | 'accent';
  block?: boolean;
  disabled?: boolean;
}

/** Pill button; the label rolls up to a duplicate on hover. Renders as Link, anchor or button. */
export function Button({ children, to, href, onClick, type = 'button', variant = 'solid', block, disabled }: Props) {
  const className = `btn btn-${variant}${block ? ' btn-block' : ''}`;
  const inner = (
    <span className="btn-roll">
      <span className="btn-label">{children}</span>
      <span className="btn-label" aria-hidden>{children}</span>
    </span>
  );
  if (to) return <Link to={to} className={className}>{inner}</Link>;
  if (href) return <a href={href} className={className} onClick={href.startsWith('#') ? scrollToHash : undefined}>{inner}</a>;
  return <button type={type} className={className} onClick={onClick} disabled={disabled}>{inner}</button>;
}

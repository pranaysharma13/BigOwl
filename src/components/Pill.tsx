import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { ArrowUpRight } from './icons';

type Variant = 'ink' | 'blue' | 'ghost' | 'light';

export function PillLink({ to, children, variant = 'ink', small }: { to: string; children: ReactNode; variant?: Variant; small?: boolean }) {
  return (
    <Link to={to} className={`pill ${variant === 'ink' ? '' : variant} ${small ? 'sm' : ''}`}>
      {children}
      <span className="arr"><ArrowUpRight /></span>
    </Link>
  );
}

export function PillButton({
  onClick, children, variant = 'ink', small, disabled, type = 'button', noArrow,
}: { onClick?: () => void; children: ReactNode; variant?: Variant; small?: boolean; disabled?: boolean; type?: 'button' | 'submit'; noArrow?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`pill ${variant === 'ink' ? '' : variant} ${small ? 'sm' : ''} ${noArrow ? 'noarr' : ''}`}>
      {children}
      {!noArrow && <span className="arr"><ArrowUpRight /></span>}
    </button>
  );
}

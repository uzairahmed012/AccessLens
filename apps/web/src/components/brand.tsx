import { ScanLine } from 'lucide-react';
import { Link } from 'react-router';

export function Brand({ to = '/', label = 'AccessLens home' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="brand" aria-label={label}>
      <span className="brand-icon">
        <ScanLine size={23} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span>
        Access<span className="brand-light">Lens</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

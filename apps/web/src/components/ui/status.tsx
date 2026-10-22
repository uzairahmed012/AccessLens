import { Circle, OctagonAlert, TriangleAlert, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { m, useReducedMotion } from 'motion/react';

export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';
const icons = { critical: OctagonAlert, serious: TriangleAlert, moderate: Info, minor: Circle };
export function SeverityBadge({ severity }: { severity: Severity }) {
  const Icon = icons[severity];
  return (
    <span className={cn('severity-badge', `severity-${severity}`)}>
      <Icon size={13} aria-hidden="true" />
      {severity[0]!.toUpperCase() + severity.slice(1)}
    </span>
  );
}
export function StatusBadge({ children }: { children: string }) {
  return (
    <span className="status-badge">
      <Circle size={11} aria-hidden="true" />
      {children}
    </span>
  );
}
export function Skeleton({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <m.span
      className={cn('ui-skeleton', className)}
      aria-hidden="true"
      initial={false}
      animate={{ opacity: reduced ? 1 : [1, 0.5, 1] }}
      transition={{ duration: reduced ? 0 : 1.5, repeat: reduced ? 0 : Infinity }}
    />
  );
}

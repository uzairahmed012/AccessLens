import { ChevronRight } from 'lucide-react';
import { SeverityBadge, type Severity } from './ui/status';

export function FindingCard({
  title,
  rule,
  severity,
  selected,
  onSelect,
}: {
  title: string;
  rule: string;
  severity: Severity;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`finding-card ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="finding-card-top">
        <SeverityBadge severity={severity} />
        <ChevronRight size={15} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <code>{rule}</code>
    </button>
  );
}
